import { createSessionCookie, getAdminPassword, getLoginAttemptKey } from "../_shared/auth.js";
import { clearLoginAttempt, ensureSchema, getActiveLoginLock, recordFailedLogin } from "../_shared/db.js";
import { json, readJson, requireBinding } from "../_shared/http.js";

export async function onRequestPost({ request, env }) {
  try {
    const db = requireBinding(env, "DB");
    await ensureSchema(db);

    const body = await readJson(request, 2000);
    const password = String(body.password || "");
    const attemptKey = await getLoginAttemptKey(request, env);
    const activeLock = await getActiveLoginLock(db, attemptKey);

    if (activeLock) {
      return json(
        { ok: false, message: `密碼錯誤太多次，請 ${formatRetryMinutes(activeLock.retryAfterSeconds)} 後再試。` },
        429,
        { "retry-after": String(activeLock.retryAfterSeconds) }
      );
    }

    if (password !== getAdminPassword(env)) {
      const failed = await recordFailedLogin(db, attemptKey);
      if (failed.lockedUntil) {
        return json(
          { ok: false, message: `密碼錯誤太多次，請 ${formatRetryMinutes(failed.retryAfterSeconds)} 後再試。` },
          429,
          { "retry-after": String(failed.retryAfterSeconds) }
        );
      }

      return json({ ok: false, message: `密碼不正確，還可以再試 ${failed.remainingAttempts} 次。` }, 401);
    }

    await clearLoginAttempt(db, attemptKey);

    return json({ ok: true }, 200, {
      "set-cookie": await createSessionCookie(env, request)
    });
  } catch (error) {
    return json({
      ok: false,
      message: "登入設定尚未完成。",
      detail: String(error && error.message || error)
    }, 500);
  }
}

function formatRetryMinutes(seconds) {
  return `${Math.max(Math.ceil(seconds / 60), 1)} 分鐘`;
}
