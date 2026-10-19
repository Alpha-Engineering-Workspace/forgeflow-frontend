import 'server-only';
import { z } from 'zod';
import { workspacePrincipal } from '../../workspaces/server/workspace-gateway.js';

const uuid = z.uuid();
const name = z.string().trim().min(2).max(120);
const email = z.email().trim().toLowerCase().max(254);
const schemas = {
  projectCreate: z.strictObject({ name, description: z.string().trim().max(2000).default('') }),
  projectUpdate: z.strictObject({ name, description: z.string().trim().max(2000), expectedVersion: z.number().int().min(1) }),
  archive: z.strictObject({ expectedVersion: z.number().int().min(1) }),
  invitation: z.strictObject({ email, role: z.enum(['ADMIN','MEMBER']) }),
  role: z.strictObject({ role: z.enum(['ADMIN','MEMBER']) }),
  accept: z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }),
};
const projectDTO = (p) => ({ id:p.id, workspaceId:p.workspaceId, name:p.name,
  description:p.description, status:p.status, version:p.version, createdBy:p.createdBy,
  createdAt:p.createdAt, updatedAt:p.updatedAt, archivedAt:p.archivedAt });
const memberDTO = (m) => ({userId:m.userId, role:m.role, joinedAt:m.joinedAt});
const invitationDTO = (i) => ({id:i.id,email:i.email,role:i.role,status:i.status,
  deliveryStatus:i.deliveryStatus,expiresAt:i.expiresAt,createdAt:i.createdAt});
function failure(status, code, message) {
  return Response.json({error:{code,message}},{status,headers:{'Cache-Control':'no-store'}});
}
function gatewayURL(path) {
  try {
    const u = new URL(process.env.FORGEFLOW_GATEWAY_URL);
    if (!['http:','https:'].includes(u.protocol) || u.username || u.password || u.pathname!=='/' || u.search || u.hash) return null;
    u.pathname=`/api/workspaces${path}`;return u;
  } catch {return null;}
}
async function validatedBody(req, schema) {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return {status:415};
  if (Number(req.headers.get('content-length') || 0)>4096) return {status:413};
  try {
    const raw=await req.text();
    if(new TextEncoder().encode(raw).byteLength>4096) return {status:413};
    const parsed=schemas[schema].safeParse(JSON.parse(raw));
    if(!parsed.success) return {status:400};
    return {data:parsed.data};
  } catch {return {status:400};}
}

// `kind` is chosen by a fixed Route Handler; no arbitrary browser-supplied URL or method.
export async function handleDomainRequest(req, {kind,method,workspaceId,projectId,invitationId,memberId, authorize=workspacePrincipal, fetchImpl=fetch}) {
  if (workspaceId && !uuid.safeParse(workspaceId).success) return failure(400,'VALIDATION_ERROR','Invalid workspace');
  for (const id of [projectId,invitationId,memberId]) if(id && !uuid.safeParse(id).success) return failure(400,'VALIDATION_ERROR','Invalid record ID');
  const routes={
    projects: { path:`/${workspaceId}/projects`, methods:['GET','POST'],schema:'projectCreate' },
    project: { path:`/${workspaceId}/projects/${projectId}`,methods:['GET','PATCH'],schema:'projectUpdate' },
    archive: { path:`/${workspaceId}/projects/${projectId}/archive`,methods:['POST'],schema:'archive' },
    invitations: { path:`/${workspaceId}/invitations`,methods:['GET','POST'],schema:'invitation' },
    resend: { path:`/${workspaceId}/invitations/${invitationId}/resend`,methods:['POST'] },
    cancel: { path:`/${workspaceId}/invitations/${invitationId}/cancel`,methods:['POST'] },
    member: { path:`/${workspaceId}/members/${memberId}`,methods:['PATCH','DELETE'],schema:'role' },
    accept: { path:'/invitations/accept',methods:['POST'],schema:'accept' },
  };
  const route=routes[kind];
  if (!route || !route.methods.includes(method) || (kind!=='accept' && !workspaceId)) return failure(404,'NOT_FOUND','Route not found');
  if (['project','archive'].includes(kind) && !projectId || ['resend','cancel'].includes(kind) && !invitationId || kind==='member' && !memberId) {
    return failure(404,'NOT_FOUND','Route not found');
  }
  if(method!=='GET') {
    const origin=req.headers.get('origin');
    if(!origin || origin!==new URL(req.url).origin) return failure(403,'FORBIDDEN_ORIGIN','Invalid origin');
  }
  const url=gatewayURL(route.path);
  const key=process.env.GATEWAY_BFF_KEY;
  if(!url || !key || key.length<32) return failure(503,'NOT_CONFIGURED','Service unavailable');
  const query=new URL(req.url).searchParams;
  if(kind==='projects' && method==='GET') {
    for(const field of query.keys()) if(!['page','limit','status'].includes(field) || query.getAll(field).length!==1) return failure(400,'VALIDATION_ERROR','Invalid query');
    for(const field of ['page','limit']) {const v=query.get(field);if(v!==null){if(!/^\d{1,4}$/.test(v))return failure(400,'VALIDATION_ERROR','Invalid page');url.searchParams.set(field,v);}}
    const status=query.get('status');if(status!==null){if(!['ACTIVE','ARCHIVED'].includes(status)) return failure(400,'VALIDATION_ERROR','Invalid project status');url.searchParams.set('status',status);}
  } else if(query.size) return failure(400,'VALIDATION_ERROR','Unexpected query');
  let body;
  if(method==='POST' || method==='PATCH') {
    if(route.schema) {
      const result=await validatedBody(req,route.schema);
      if(result.status)return failure(result.status,'VALIDATION_ERROR','Invalid request');
      body=result.data;
    } else {
      // Resend/cancel are explicit empty-body actions.
      if(Number(req.headers.get('content-length') || 0)>0) return failure(400,'VALIDATION_ERROR','No request body allowed');
    }
  }
  let principal;
  try {principal=await authorize(req);} catch {return failure(503,'SESSION_UNAVAILABLE','Session unavailable');}
  if(!principal?.accessToken)return failure(401,'UNAUTHORIZED','Sign in to continue');
  try {
    const upstream=await fetchImpl(url,{method,headers:{'content-type':'application/json',
      'x-forgeflow-bff-key':key,authorization:`Bearer ${principal.accessToken}`},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000),cache:'no-store'});
    if(upstream.status===204)return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
    if(![200,201,202,400,401,403,404,409,429,503].includes(upstream.status)) return failure(502,'UPSTREAM_INVALID','Service unavailable');
    const data=await upstream.json();
    if(!data || typeof data!=='object')return failure(502,'UPSTREAM_INVALID','Service unavailable');
    if(!upstream.ok) {
      if(upstream.status===429) {
        const retry=upstream.headers.get('retry-after');
        const headers={'Cache-Control':'no-store'};
        if(retry&&/^\d+$/.test(retry)) headers['Retry-After']=retry;
        return Response.json({error:{code:'RATE_LIMITED',message:'Too many requests'}},{status:429,headers});
      }
      return failure(upstream.status,typeof data.error?.code==='string'?data.error.code:'DOMAIN_ERROR',
        typeof data.error?.message==='string'?data.error.message:'Request failed');
    }
    let safe;
    if(kind==='projects'&&method==='GET') {
      if(!Array.isArray(data.projects)||!data.pagination)return failure(502,'UPSTREAM_INVALID','Service unavailable');
      safe={projects:data.projects.map(projectDTO),pagination:{page:data.pagination.page,limit:data.pagination.limit,total:data.pagination.total}};
    } else if(['project','projects','archive'].includes(kind)) {
      if(!data.project?.id)return failure(502,'UPSTREAM_INVALID','Service unavailable');
      safe={project:projectDTO(data.project)};
    } else if(kind==='invitations'&&method==='GET') {
      if(!Array.isArray(data.invitations))return failure(502,'UPSTREAM_INVALID','Service unavailable');
      safe={invitations:data.invitations.map(invitationDTO)};
    } else if(['invitations','resend','cancel'].includes(kind)) {
      if(!data.invitation?.id)return failure(502,'UPSTREAM_INVALID','Service unavailable');
      safe={invitation:invitationDTO(data.invitation)};
    } else if(kind==='member') {
      if(!data.member?.userId)return failure(502,'UPSTREAM_INVALID','Service unavailable');
      safe={member:memberDTO(data.member)};
    } else if(kind==='accept') {
      if(!uuid.safeParse(data.membership?.workspaceId).success)return failure(502,'UPSTREAM_INVALID','Service unavailable');
      safe={membership:{workspaceId:data.membership.workspaceId,role:data.membership.role}};
    }
    return Response.json(safe,{status:upstream.status,headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const timeout=['TimeoutError','AbortError'].includes(error?.name);
    return failure(timeout?504:502,timeout?'GATEWAY_TIMEOUT':'GATEWAY_UNREACHABLE','Service unavailable');
  }
}
