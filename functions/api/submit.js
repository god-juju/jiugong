import { ensureSchema } from "../_shared/db.js";
import { json, readJson, requireBinding } from "../_shared/http.js";

export async function onRequestPost({ request, env }) {
  try {
    const db = requireBinding(env, "DB");
    await ensureSchema(db);

    const payload = await readJson(request);
    const now = new Date().toISOString();
    const id = cleanText(payload["送出編號"]) || createSubmissionId();
    const studentName = cleanText(payload["門生姓名（中文）"]);
    const mobilePhone = cleanText(payload["行動電話"]);
    const email = cleanText(payload["電子郵件"]);
    const lineId = cleanText(payload["Line ID"]);
    const validationMessage = validatePayload(payload);

    if (validationMessage) {
      return json({ ok: false, message: validationMessage }, 400);
    }

    await db.prepare(`
      INSERT INTO submissions (
        id,
        created_at,
        student_name,
        mobile_phone,
        email,
        line_id,
        birth_date,
        gender,
        marital_status,
        nationality,
        current_region,
        referrer_name,
        learned_jiugong,
        known_from,
        motivation,
        payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      now,
      studentName,
      mobilePhone,
      email,
      lineId,
      cleanText(payload["出生年月日"]),
      cleanText(payload["性別"]),
      cleanText(payload["婚姻狀況"]),
      cleanText(payload["國籍"]),
      cleanText(payload["現居國家／地區"]),
      cleanText(payload["引薦人姓名"]),
      cleanText(payload["是否曾學習九宮課程"]),
      cleanText(payload["如何認識九宮"]),
      cleanText(payload["入門動機"]),
      JSON.stringify({ ...payload, "送出編號": id, "後台收到時間": now })
    ).run();

    return json({ ok: true, id, createdAt: now });
  } catch (error) {
    const duplicate = String(error && error.message || "").includes("UNIQUE");
    return json({
      ok: false,
      message: duplicate ? "這筆資料已經送出過，請不要重複送出。" : "資料送出失敗，請稍後再試。",
      detail: duplicate ? undefined : String(error && error.message || error)
    }, duplicate ? 409 : 500);
  }
}

export function onRequestGet() {
  return json({ ok: true, message: "九宮表單後台 API 正常。" });
}

function cleanText(value) {
  return String(value || "").trim();
}

function validatePayload(payload) {
  const requiredFields = [
    "門生姓名（中文）",
    "出生年月日",
    "性別",
    "婚姻狀況",
    "國籍",
    "現居國家／地區",
    "永久戶籍地址",
    "通訊地址",
    "行動電話",
    "電子郵件",
    "Line ID",
    "是否曾學習九宮課程",
    "如何認識九宮",
    "入門動機"
  ];
  const missing = requiredFields.filter((field) => !cleanText(payload[field]));

  if (missing.length > 0) {
    return `請補齊必填欄位：${missing.join("、")}。`;
  }

  const email = cleanText(payload["電子郵件"]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "電子郵件格式不正確。";
  }

  if (cleanText(payload["入門動機"]).length < 50) {
    return "入門動機至少需要 50 字。";
  }

  const confirmation = cleanText(payload["確認聲明"]);
  const requiredConfirmations = [
    "六條戒律",
    "學理傳承",
    "資料均屬真實",
    "個人資料蒐集"
  ];
  if (requiredConfirmations.some((text) => !confirmation.includes(text))) {
    return "確認聲明四項都需要勾選。";
  }

  if (cleanText(payload["個資同意"]) !== "已同意") {
    return "需要同意個人資料蒐集告知暨同意聲明。";
  }

  return "";
}

function createSubmissionId() {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  const datePart = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const timePart = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `JG-${datePart}-${timePart}-${randomPart}`;
}
