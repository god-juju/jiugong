# 九宮入門登記表

這是九宮門生入門意願登記表的獨立靜態網站專案。

## 檔案

- `index.html`：正式填寫頁面
- `admin.html`：老闆登入後台，需部署到 Cloudflare Pages 才能使用
- `functions/api/*`：Cloudflare Pages 後台 API
- `schema.sql`：D1 資料庫欄位表
- `設定說明.md`：Google 表單後台與欄位對照說明
- `後台設定.md`：Cloudflare Pages + D1 資料庫設定說明

## 使用方式

正式填表網址：

`https://jiugong-cmj.pages.dev/`

老闆後台：

`https://jiugong-cmj.pages.dev/admin.html`

本機也可以直接用瀏覽器打開 `index.html` 查看畫面。

正式上線後，表單會優先送到 Cloudflare D1 資料庫。

如果後台尚未部署完成，會保留 Google 表單作為備援。

## 未來部署

這個資料夾可以獨立 commit / push，不需要跟報表中心放在同一個專案。

目前已設定 GitHub Actions 自動部署。

之後只要 commit 並 push 到 `main`，GitHub 會自動部署到 Cloudflare Pages。

如果自動部署失敗，請檢查 GitHub repo 的 Secrets 是否有：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

詳細設定方式看 `後台設定.md`。
