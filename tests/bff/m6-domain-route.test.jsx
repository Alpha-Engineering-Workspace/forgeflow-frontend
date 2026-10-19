// @vitest-environment node
import { afterEach,describe,expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('next-auth/jwt',()=>({getToken:vi.fn()}));
vi.mock('../../src/auth.js',()=>({auth:vi.fn()}));
import { handleDomainRequest } from '../../src/features/milestone6/server/domain-gateway.js';
const w='28ebcd8e-48e3-4de3-9406-36bc06e42c9e';
const p='894c85b9-776f-4ea8-8a84-0a070e7ceea5';
const token='t'.repeat(43);
const principal=async()=>({accessToken:'PRIVATE_ACCESS_JWT',userId:'verified-user'});
const root='http://localhost:3000/api/backend/workspaces';
const make=(suffix='',method='GET',body,origin='http://localhost:3000')=>new Request(root+suffix,{
  method,headers:{origin,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
function setup(){vi.stubEnv('FORGEFLOW_GATEWAY_URL','http://gateway:3001');vi.stubEnv('GATEWAY_BFF_KEY','x'.repeat(40));}
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('M6 BFF allowlist, DTO and token boundary',()=>{
  it('rejects forged origins/unknown IDs and missing sessions',async()=>{
    setup();const fetchImpl=vi.fn();
    expect((await handleDomainRequest(make(`/${w}/projects`,'POST',{name:'Project',description:''},'https://evil.test'),{kind:'projects',method:'POST',workspaceId:w,authorize:principal,fetchImpl})).status).toBe(403);
    expect((await handleDomainRequest(make('/bad/projects'),{kind:'projects',method:'GET',workspaceId:'bad',authorize:principal,fetchImpl})).status).toBe(400);
    expect((await handleDomainRequest(make(`/${w}/projects`),{kind:'projects',method:'GET',workspaceId:w,authorize:async()=>null,fetchImpl})).status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('only forwards strict project payload, hides unexpected upstream secret',async()=>{
    setup();const fetchImpl=vi.fn(async()=>Response.json({project:{id:p,workspaceId:w,name:'Project',description:'',status:'ACTIVE',version:1,secret:'NEVER'}} ,{status:201}));
    const result=await handleDomainRequest(make(`/${w}/projects`,'POST',{name:' Project ',description:''}),{kind:'projects',method:'POST',workspaceId:w,authorize:principal,fetchImpl});
    expect(result.status).toBe(201);
    const data=await result.json();expect(data.project.name).toBe('Project');expect(JSON.stringify(data)).not.toContain('NEVER');
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toBe('Bearer PRIVATE_ACCESS_JWT');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).name).toBe('Project');
  });
  it('accepts invitation with only opaque token, never trusting a body email or owner role',async()=>{
    setup();const fetchImpl=vi.fn(async()=>Response.json({membership:{workspaceId:w,role:'MEMBER',accessToken:'NEVER'}}));
    const r=await handleDomainRequest(make('/invitations/accept','POST',{token}),{kind:'accept',method:'POST',authorize:principal,fetchImpl});
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({membership:{workspaceId:w,role:'MEMBER'}});
    const forbidden=await handleDomainRequest(make('/invitations/accept','POST',{token,email:'forged@example.com'}),{kind:'accept',method:'POST',authorize:principal,fetchImpl});
    expect(forbidden.status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('denies unknown query parameters and stale updates with caller-supplied expectedVersion',async()=>{
    setup();const fetchImpl=vi.fn(async()=>Response.json({error:{code:'VERSION_CONFLICT',message:'Project changed'}},{status:409}));
    const illegal=await handleDomainRequest(make(`/${w}/projects?workspaceId=${p}`),{kind:'projects',method:'GET',workspaceId:w,authorize:principal,fetchImpl});
    expect(illegal.status).toBe(400);
    const stale=await handleDomainRequest(make(`/${w}/projects/${p}`,'PATCH',{name:'Update',description:'',expectedVersion:1}),{kind:'project',method:'PATCH',workspaceId:w,projectId:p,authorize:principal,fetchImpl});
    expect(stale.status).toBe(409);
  });
});
