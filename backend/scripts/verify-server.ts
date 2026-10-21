import { loadEnv } from "@/backend/config/env";
import { buildApp } from "@/backend/app";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const env = loadEnv();
  const app = await buildApp();

  try {
    const health = await app.inject({ method: "GET", url: "/health" });
    assert(health.statusCode === 200, `/health status ${health.statusCode}`);
    const healthJson = health.json() as { ok?: boolean; data?: { status?: string } };
    assert(healthJson.ok === true, "/health body.ok");
    assert(healthJson.data?.status === "ok", "/health body.data.status");
    assert(health.headers["x-content-type-options"] === "nosniff", "helmet nosniff missing");

    const cors = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: env.corsOrigins[0] },
    });
    assert(cors.headers["access-control-allow-origin"] === env.corsOrigins[0], "CORS allow origin missing");
    assert(cors.headers["access-control-allow-credentials"] === "true", "CORS credentials missing");

    const preflight = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: env.corsOrigins[0],
        "access-control-request-method": "GET",
        "access-control-request-headers": "x-csrf-token",
      },
    });
    assert(preflight.statusCode === 204 || preflight.statusCode === 200, `CORS preflight status ${preflight.statusCode}`);
    assert(preflight.headers["access-control-allow-origin"] === env.corsOrigins[0], "CORS preflight origin missing");

    const denied = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "https://evil.example",
        "access-control-request-method": "GET",
      },
    });
    assert(
      denied.headers["access-control-allow-origin"] !== "https://evil.example",
      "CORS must not reflect an unknown origin",
    );

    const ready = await app.inject({ method: "GET", url: "/ready" });
    assert(ready.statusCode === 200 || ready.statusCode === 503, `/ready status ${ready.statusCode}`);
    const readyJson = ready.json() as {
      ok?: boolean;
      error?: string;
      data?: Record<string, string>;
      checks?: Record<string, string>;
    };
    if (ready.statusCode === 200) {
      assert(readyJson.ok === true, "/ready body.ok");
      assert(readyJson.data?.database === "ok", "/ready database");
      assert(readyJson.data?.storage === "ok", "/ready storage");
      assert(readyJson.data?.chromium === "ok", "/ready chromium");
    } else {
      assert(readyJson.ok === false, "/ready 503 body.ok");
      assert(readyJson.error === "Service not ready.", "/ready 503 error");
      assert(readyJson.checks, "/ready 503 checks");
    }

    const csrf = await app.inject({ method: "GET", url: "/v1/auth/csrf" });
    assert(csrf.statusCode === 200, `/v1/auth/csrf status ${csrf.statusCode}`);
    const csrfJson = csrf.json() as { ok?: boolean; data?: { csrfToken?: string } };
    assert(csrfJson.ok === true, "/v1/auth/csrf body.ok");
    assert(Boolean(csrfJson.data?.csrfToken), "/v1/auth/csrf token");
    const setCookie = csrf.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie ?? "");
    assert(cookieHeader.includes("shi_csrf") || cookieHeader.includes("_csrf"), "CSRF cookie missing");

    const missing = await app.inject({ method: "GET", url: "/v1/does-not-exist" });
    assert(missing.statusCode === 404, `/missing status ${missing.statusCode}`);

    console.log(
      JSON.stringify(
        {
          ok: true,
          health: health.statusCode,
          ready: ready.statusCode,
          csrf: csrf.statusCode,
          readyChecks: ready.statusCode === 200 ? readyJson.data : readyJson.checks,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
