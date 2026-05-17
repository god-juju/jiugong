import { isAuthenticated } from "../_shared/auth.js";
import { json } from "../_shared/http.js";

export async function onRequestGet({ request, env }) {
  try {
    return json({ ok: true, authenticated: await isAuthenticated(request, env) });
  } catch {
    return json({ ok: true, authenticated: false });
  }
}
