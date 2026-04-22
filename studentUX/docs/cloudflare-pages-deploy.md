# Deploy to Cloudflare Pages

## One-time setup

1. **Create a Cloudflare API token**
   - Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Create Token → Use template "Edit Cloudflare Workers" or custom with:
     - **Permissions:** Account → Cloudflare Pages → Edit
   - Copy the token

2. **Create the Pages project** (first time only)
   ```bash
   npx wrangler pages project create exxat-one-student-ux
   ```

3. **Set the API token** (choose one)
   - **Option A – env var (recommended for CI):**
     ```bash
     export CLOUDFLARE_API_TOKEN=your_token_here
     ```
   - **Option B – login (interactive):**
     ```bash
     npx wrangler login
     ```

## Deploy

```bash
npm run deploy:cf
```

Or manually:

```bash
npm run build
npx wrangler pages deploy build --project-name=exxat-one-student-ux --branch=production
```

Your app will be live at `https://exxat-one-student-ux-3q8.pages.dev` (or `https://production.exxat-one-student-ux-3q8.pages.dev`).

**Production branch:** For Direct Upload projects, the production branch is named `production` (not `main`). Use `--branch=production` so deploys update the live site. Without it, deploys only create preview URLs (hash-based).

## Safari / Mac looks “zoomed” on production only

1. **Per-site zoom:** Safari → Settings → Websites → Page Zoom — set your `*.pages.dev` (or custom) domain to **100%**.
2. **Adobe Fonts (Typekit):** In [Adobe Fonts / Web Project](https://fonts.adobe.com/), add every hostname that loads the app (e.g. `*.pages.dev`, your custom domain). If the kit blocks the domain, Ivy Presto may not load and layout can look wrong.
3. The app sets `-webkit-text-size-adjust: 100%` and a strict viewport meta to reduce WebKit text inflation on deployed URLs.
