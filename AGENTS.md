# 九宮入門登記表專案規則

## 專案用途

這個資料夾是九宮入門意願登記表的獨立靜態網站專案。

主要檔案：

- `index.html`：正式填寫頁面
- `admin.html`：老闆登入後台
- `functions/api/*`：Cloudflare Pages 後台 API
- `schema.sql`：D1 資料庫欄位表
- `wrangler.toml`：Cloudflare Pages / D1 部署設定
- `後台設定.md`：Cloudflare 後台設定說明
- `設定說明.md`：Google 表單後台與欄位對照說明
- `README.md`：專案簡介

## 回覆方式

使用者是程式小白，不懂程式。

所有回覆都要：

- 用繁體中文
- 直白、好懂
- 少用專業術語
- 如果一定要講技術詞，要順手解釋它的意思

## 重要邊界

這個專案已經從報表中心拆出來。

不要把九宮表單放回：

- `C:\Users\JUJU\repos\transgene-reports-v2`
- `https://reports.transgene.com.tw`

除非使用者明確要求，否則不要修改報表中心專案。

## 資料收集方式

目前 `index.html` 會優先送出資料到 Cloudflare Pages + D1 資料庫。

老闆可透過 `admin.html` 登入查看資料、搜尋與匯出 CSV。

Google 表單仍保留為備援。只有 Cloudflare 後台連線失敗或伺服器錯誤時，前端才可改走 Google 表單備援。

如果 Cloudflare 後台回覆資料不合格（例如缺必填、未同意個資），不要改送 Google 表單，必須請填表人修正後再送出。

填表頁看到「資料已送出成功」才代表進入新後台資料庫。

如果走 Google 表單備援，看到「已記錄你的回覆」才代表 Google 表單備援送出成功。

不要隨意改掉 `index.html` 裡的 Google 表單網址與 `entry.xxxxx` 欄位代碼。

如果要改 Google 表單欄位，必須同步更新：

- `index.html`
- `設定說明.md`

## Git 規則

這是獨立 repo：

`https://github.com/god-juju/jiugong`

未來 commit / push 都在這個資料夾內處理。

不要把這個專案的檔案 commit 到報表中心 repo。

使用者說 `commit` 和 `push` 時，要分開處理：

1. 先 commit
2. 使用者確認後再 push

## 部署提醒

目前程式碼已經在 GitHub。

如果要讓外部使用者有正式網址，優先考慮 GitHub Pages 或 Cloudflare Pages。

目前正式站已部署在 Cloudflare Pages：

- 填表頁：`https://jiugong-cmj.pages.dev/`
- 老闆後台：`https://jiugong-cmj.pages.dev/admin.html`

若使用後台登入與資料庫功能，必須用 Cloudflare Pages，不能只靠 GitHub Pages。
