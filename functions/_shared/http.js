export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

export function methodNotAllowed() {
  return json({ ok: false, message: "這個操作方式不支援。" }, 405, {
    allow: "GET, POST"
  });
}

export async function readJson(request, maxLength = 80000) {
  const text = await request.text();
  if (!text) return {};
  if (text.length > maxLength) {
    throw new Error("送出的資料太大，請檢查內容後再送出。");
  }
  return JSON.parse(text);
}

export function requireBinding(env, name) {
  if (!env || !env[name]) {
    throw new Error(`後台尚未設定 ${name}。`);
  }
  return env[name];
}
