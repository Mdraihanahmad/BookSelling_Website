# Sellb (Book Selling Website)

This repo is a monorepo:
- `client/` = Vite + React frontend
- `server/` = Express + MongoDB backend
- `api/[...path].js` = Vercel serverless entry that forwards `/api/*` to the Express app

## Why it works on localhost but fails after deployment

In production (especially on Vercel), the backend depends on **environment variables** and the filesystem is **not a reliable place** to store uploads.

If login fails or API calls return 500/503, open:
- `/api/health`

It shows whether required config is present (without revealing secrets).

## Required environment variables (Production)

Set these in your deployment platform (Vercel Project → Settings → Environment Variables):

- `MONGO_URI` (or `MONGODB_URI`) — MongoDB connection string
- `JWT_SECRET` — secret used to sign/verify login tokens

Optional (payments):
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Recommended for uploads on Vercel:
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)

## Thumbnails / uploads in production

### If your Book records contain URLs like `/uploads/thumbnails/...`
That means they were created using **local disk uploads**.

On Vercel, those files may not exist (or won’t persist), so thumbnails (and PDFs) can appear “missing” after deployment.

### Recommended fix: move uploads to Vercel Blob
1. Create a Blob store in Vercel.
2. Add `BLOB_READ_WRITE_TOKEN` to env vars.
3. Migrate existing DB records (run locally):

```powershell
cd server
# Ensure you have MONGO_URI + BLOB_READ_WRITE_TOKEN set in your shell
node scripts/migrateUploadsToBlob.js
```

After migration, `thumbnailUrl` and `pdfUrl` will be `https://...` blob URLs and will work in production.

## Dev

```powershell
# backend
cd server
npm install
npm run dev

# frontend (separate terminal)
cd client
npm install
npm run dev
```
