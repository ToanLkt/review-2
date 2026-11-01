import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiError,
  buildApiUrl,
  createApiClient,
} from "@/lib/api/client";
import type {
  TokenPersistence,
  TokenStore,
} from "@/lib/api/token-storage";
import type { AuthTokens } from "@/lib/api/types";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createTokenStore(initial?: AuthTokens): TokenStore {
  let tokens = initial ?? null;
  let persistence: TokenPersistence = "session";

  return {
    getAccessToken: () => tokens?.accessToken ?? null,
    getRefreshToken: () => tokens?.refreshToken ?? null,
    getExpiresAt: () => tokens?.expiresAt ?? null,
    getPersistence: () => persistence,
    setTokens: (next, nextPersistence = "session") => {
      tokens = next;
      persistence = nextPersistence;
    },
    clear: () => {
      tokens = null;
    },
  };
}

test("build URL with API prefix and query parameters", () => {
  const url = buildApiUrl("http://localhost:5080/", "/api/v1", "/seeds", {
    page: 2,
    active: true,
    category: ["leaf", "root"],
    empty: null,
  });

  assert.equal(
    url,
    "http://localhost:5080/api/v1/seeds?page=2&active=true&category=leaf&category=root",
  );
});

test("GET attaches Bearer token and returns ApiResponse<T>", async () => {
  const tokens = createTokenStore({
    accessToken: "access-1",
    refreshToken: "refresh-1",
    expiresAt: null,
  });
  let authorization = "";
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (_, init) => {
      authorization = new Headers(init?.headers).get("Authorization") ?? "";
      return jsonResponse({
        success: true,
        message: null,
        data: { id: 1 },
        errors: null,
      });
    },
  });

  const response = await client.get<{ id: number }>("/auth/me");
  assert.equal(authorization, "Bearer access-1");
  assert.deepEqual(response.data, { id: 1 });
});

test("POST serializes a JSON body", async () => {
  let body = "";
  let contentType = "";
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async (_, init) => {
      body = String(init?.body);
      contentType = new Headers(init?.headers).get("Content-Type") ?? "";
      return jsonResponse({ success: true, message: null, data: null, errors: null });
    },
  });

  await client.post("/example", { name: "SmartFarm" }, { auth: false });
  assert.equal(body, JSON.stringify({ name: "SmartFarm" }));
  assert.equal(contentType, "application/json");
});

test("default fetcher preserves the global fetch receiver", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = function receiverSensitiveFetch(this: typeof globalThis) {
    assert.equal(this, globalThis);
    return Promise.resolve(jsonResponse({
      success: true,
      message: null,
      data: { ok: true },
      errors: null,
    }));
  } as typeof fetch;

  try {
    const client = createApiClient({ baseUrl: "http://localhost:5080" });
    const response = await client.get<{ ok: boolean }>("/receiver-check", {
      auth: false,
    });
    assert.deepEqual(response.data, { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("401 refreshes once and retries with the new access token", async () => {
  const tokens = createTokenStore({
    accessToken: "expired-access",
    refreshToken: "refresh-1",
    expiresAt: null,
  });
  const calls: { url: string; authorization: string; body: string }[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const call = {
        url: String(input),
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
        body: String(init?.body ?? ""),
      };
      calls.push(call);

      if (call.url.endsWith("/api/v1/auth/refresh-token")) {
        return jsonResponse({
          success: true,
          message: null,
          data: {
            tokens: {
              accessToken: "fresh-access",
              refreshToken: "refresh-2",
              expiresAt: "2030-01-01T00:00:00Z",
            },
            user: null,
          },
          errors: null,
        });
      }

      if (call.authorization === "Bearer expired-access") {
        return jsonResponse(
          { success: false, message: "Unauthorized", data: null, errors: null },
          401,
        );
      }

      return jsonResponse({
        success: true,
        message: null,
        data: { id: 1 },
        errors: null,
      });
    },
  });

  const response = await client.get<{ id: number }>("/auth/me");
  assert.deepEqual(response.data, { id: 1 });
  assert.equal(calls.length, 3);
  assert.equal(calls[1].body, JSON.stringify({ refreshToken: "refresh-1" }));
  assert.equal(calls[2].authorization, "Bearer fresh-access");
  assert.equal(tokens.getRefreshToken(), "refresh-2");
});

test("failed refresh clears tokens and exposes the original 401", async () => {
  const tokens = createTokenStore({
    accessToken: "expired-access",
    refreshToken: "invalid-refresh",
    expiresAt: null,
  });
  let unauthorizedCalls = 0;
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    onUnauthorized: () => {
      unauthorizedCalls += 1;
    },
    fetcher: async (input) =>
      String(input).endsWith("/api/v1/auth/refresh-token")
        ? jsonResponse(
            { success: false, message: "Invalid refresh", data: null, errors: null },
            401,
          )
        : jsonResponse(
            { success: false, message: "Unauthorized", data: null, errors: null },
            401,
          ),
  });

  await assert.rejects(
    () => client.get("/auth/me"),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(tokens.getAccessToken(), null);
  assert.equal(tokens.getRefreshToken(), null);
  assert.equal(unauthorizedCalls, 1);
});

test("malformed refresh response preserves the stored session for a later retry", async () => {
  const tokens = createTokenStore({
    accessToken: "expired-access",
    refreshToken: "refresh-1",
    expiresAt: null,
  });
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input) =>
      String(input).endsWith("/api/v1/auth/refresh-token")
        ? jsonResponse({
            success: true,
            message: null,
            data: {
              tokens: {
                accessToken: "fresh-access",
                refreshToken: null,
                expiresAt: "2030-01-01T00:00:00Z",
              },
              user: null,
            },
            errors: null,
          })
        : jsonResponse(
            { success: false, message: "Unauthorized", data: null, errors: null },
            401,
          ),
  });

  await assert.rejects(
    () => client.get("/auth/me"),
    (error: unknown) => error instanceof ApiError && error.status === 502,
  );
  assert.equal(tokens.getAccessToken(), "expired-access");
  assert.equal(tokens.getRefreshToken(), "refresh-1");
});

test("temporary refresh network failure does not log the user out", async () => {
  const tokens = createTokenStore({
    accessToken: "expired-access",
    refreshToken: "refresh-1",
    expiresAt: null,
  });
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input) => {
      if (String(input).endsWith("/api/v1/auth/refresh-token")) {
        throw new TypeError("Failed to fetch");
      }
      return jsonResponse(
        { success: false, message: "Unauthorized", data: null, errors: null },
        401,
      );
    },
  });

  await assert.rejects(
    () => client.get("/auth/me"),
    (error: unknown) => error instanceof TypeError,
  );
  assert.equal(tokens.getRefreshToken(), "refresh-1");
});
