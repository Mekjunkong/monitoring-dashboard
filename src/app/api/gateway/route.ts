export async function GET() {
  const start = Date.now();
  try {
    const res = await fetch('http://127.0.0.1:18789/', {
      signal: AbortSignal.timeout(3000),
    });
    const latency = Date.now() - start;
    return Response.json({
      status: res.ok ? 'online' : 'degraded',
      latency,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      status: 'offline',
      latency: null,
      checkedAt: new Date().toISOString(),
    });
  }
}
