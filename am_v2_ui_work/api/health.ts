import type { IncomingMessage, ServerResponse } from 'http';

interface VercelHealthResponse extends ServerResponse {
  status?: (statusCode: number) => VercelHealthResponse;
  json?: (body: any) => VercelHealthResponse;
}

export default async function handler(
  _req: IncomingMessage,
  res: VercelHealthResponse
): Promise<void> {
  const data = {
    status: 'ONLINE',
    app: 'AM Digital ADR V2 Serverless Proxy (Vercel)',
    timestamp: new Date().toISOString(),
    gasConfigured: Boolean(process.env.GAS_WEB_APP_URL),
    safeMode: true,
    proxyAuthRequired: process.env.REQUIRE_PROXY_AUTH === 'true',
  };

  const jsonString = JSON.stringify(data);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const statusFn = res.status;
  const jsonFn = res.json;

  if (typeof statusFn === 'function' && typeof jsonFn === 'function') {
    statusFn.call(res, 200);
    jsonFn.call(res, data);
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonString),
  });
  res.end(jsonString);
}
