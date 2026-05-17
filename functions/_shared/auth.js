const SESSION_COOKIE = "jiugong_admin_session";
const SESSION_SECONDS = 60 * 60 * 10;

const encoder = new TextEncoder();

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

export async function createSessionCookie(env, request) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({
    iat: now,
    exp: now + SESSION_SECONDS
  }));
  const signature = await sign(payload, getCookieSecret(env));
  const secureFlag = request && new URL(request.url).protocol === "https:" ? ["Secure"] : [];

  return [
    `${SESSION_COOKIE}=${payload}.${signature}`,
    "Path=/",
    "HttpOnly",
    ...secureFlag,
    "SameSite=Strict",
    `Max-Age=${SESSION_SECONDS}`
  ].join("; ");
}

export function clearSessionCookie(request) {
  const secureFlag = request && new URL(request.url).protocol === "https:" ? ["Secure"] : [];
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    ...secureFlag,
    "SameSite=Strict",
    "Max-Age=0"
  ].join("; ");
}

export async function isAuthenticated(request, env) {
  const value = parseCookies(request)[SESSION_COOKIE];
  if (!value || !value.includes(".")) return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = await sign(payload, getCookieSecret(env));
  if (!constantTimeEqual(signature, expected)) return false;

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    return Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function requireAdmin(request, env) {
  if (await isAuthenticated(request, env)) return null;
  return new Response(JSON.stringify({ ok: false, message: "請先登入後台。" }), {
    status: 401,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function getAdminPassword(env) {
  const password = env.ADMIN_PASSWORD || "";
  if (!password || password.length < 16) {
    throw new Error("請先在 Cloudflare 設定 ADMIN_PASSWORD，至少 16 個字。");
  }
  return password;
}

export async function getLoginAttemptKey(request, env) {
  const ip = (request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${getCookieSecret(env)}|${ip || "unknown"}`)
  );
  return base64UrlEncode(digest);
}

function getCookieSecret(env) {
  const secret = env.COOKIE_SECRET || "";
  if (!secret || secret.length < 24) {
    throw new Error("請先在 Cloudflare 設定 COOKIE_SECRET，至少 24 個字。");
  }
  return secret;
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(signature);
}

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
