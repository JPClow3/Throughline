interface Env {
  API?: { fetch: typeof fetch };
  API_URL?: string;
  VITE_PUSH_API_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Direct Service Binding to the Worker
  if (env.API) {
    return env.API.fetch(request);
  }

  // 2. Proxy to external Worker URL if configured
  const targetHost = env.API_URL || env.VITE_PUSH_API_URL;
  if (targetHost && targetHost.startsWith("http")) {
    const url = new URL(request.url);
    const target = new URL(targetHost);
    url.protocol = target.protocol;
    url.hostname = target.hostname;
    url.port = target.port;
    return fetch(new Request(url.toString(), request));
  }

  return new Response(
    JSON.stringify({
      error: "API backend not connected. Please attach the 'API' Service Binding or configure VITE_PUSH_API_URL in Pages settings."
    }),
    {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
};
