import { isAuthenticated } from "../_shared/auth.js";
import { compactSubmission, ensureSchema } from "../_shared/db.js";
import { json, requireBinding } from "../_shared/http.js";

export async function onRequestGet({ request, env }) {
  try {
    if (!(await isAuthenticated(request, env))) {
      return json({ ok: false, message: "請先登入後台。" }, 401);
    }

    const db = requireBinding(env, "DB");
    await ensureSchema(db);

    const url = new URL(request.url);
    const keyword = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

    let rows;
    if (keyword) {
      const like = `%${keyword}%`;
      rows = await db.prepare(`
        SELECT *
        FROM submissions
        WHERE student_name LIKE ?
          OR mobile_phone LIKE ?
          OR email LIKE ?
          OR line_id LIKE ?
          OR referrer_name LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(like, like, like, like, like, limit).all();
    } else {
      rows = await db.prepare(`
        SELECT *
        FROM submissions
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all();
    }

    const count = await db.prepare("SELECT COUNT(*) AS total FROM submissions").first();

    return json({
      ok: true,
      total: Number(count && count.total || 0),
      submissions: (rows.results || []).map(compactSubmission)
    });
  } catch (error) {
    return json({
      ok: false,
      message: "讀取資料失敗。",
      detail: String(error && error.message || error)
    }, 500);
  }
}
