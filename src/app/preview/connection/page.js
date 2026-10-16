import { GatewayConnectionStatus } from "@/components/connection/gateway-connection-status";

export default function ConnectionPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">
        ForgeFlow Backend Connection
      </h1>

      <p className="mt-3 text-sm">
        Browser → Next.js BFF → API Gateway
      </p>

      <div className="mt-8">
        <GatewayConnectionStatus />
      </div>
    </main>
  );
}