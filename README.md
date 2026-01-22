# RealTalk MVP

Z世代向けの本音Q&Aアプリ

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、Supabaseの情報を入力：

```bash
cp .env.example .env
```

Supabaseダッシュボードから取得：
- **Settings > API** から
  - `Project URL` → `VITE_SUPABASE_URL`
  - `anon public` キー → `VITE_SUPABASE_ANON_KEY`

### 3. 開発サーバー起動

```bash
npm run dev
```

### 4. ビルド

```bash
npm run build
```

## デプロイ (Vercel)

1. GitHubにpush
2. [vercel.com](https://vercel.com) でプロジェクトをインポート
3. 環境変数を設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## 質問の追加

Supabase SQL Editorで：

```sql
INSERT INTO daily_questions (question_text, active_date)
VALUES ('新しい質問', '2025-01-23');
```
