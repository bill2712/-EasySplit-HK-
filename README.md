# EasySplit 夾錢易

A bill-splitting calculator for meals, gatherings and trips — built for people anywhere in the world.

食飯、聚會、旅行嘅夾錢／AA 計算機：加一服務費、稅、貼士、生日主角免費、多種貨幣，一秒計清楚。

## Features

### 🍽️ Quick split — at the table
- **Split evenly or by item.** Add each dish and tap who shared it; shared dishes are divided only among those people.
- **Service charge, tax, tip.** HK/Macau 加一, Singapore/Malaysia/Thailand “++” (tax charged on service), US/Canada sales tax plus tip on the pre-tax subtotal, VAT already included in Europe, and more.
- **Cover charge per person** (Italian *coperto*, table charge, tea charge) and **discounts** (% or fixed amount).
- **🎂 Treat someone.** The birthday person or a guest pays nothing; everyone else covers their share evenly.
- **Round each share up** (to $1, $5, ¥100, ₩1000 …). The app shows how much extra you collect.
- **Sums in the amount box:** type `120+85` or `3*48`.
- **Share** the breakdown to WhatsApp / LINE / WeChat, or **save it to a group**.

### ✈️ Groups & trips — running tabs
- Log expenses over days: who paid (one person or several) and who joined.
- Split **equally, by shares (2× for a couple), exact amounts, percentages, or by item**, with optional service/tax/tip on each expense.
- **Any currency per expense.** Live exchange rates (open.er-api.com, cached for offline use) convert to the group’s main currency. You can edit the rate by hand.
- **Couples & families settle as one** (“settled together with …”).
- **Settle up with the fewest transfers**, or show direct debts only. Tap “Mark paid” to record a payment.
- Add each person’s payment details (PayMe, FPS, Venmo, PayNow, PromptPay, Bizum …) so they show up next to what they’re owed.
- **Stats:** spending by category, by person (paid vs. share) and by day.
- **Share a copy by link.** The whole group is compressed into the URL, so no server is needed. You can also export to CSV, and back up or restore everything as JSON.

### 🧭 More
- **Tipping & service charge guide** for 30+ countries, one tap to use it in the calculator.
- **QR code** to hand a group to friends at the table, and **reminder messages** (with payment details) for whoever still owes.
- **Who paid** in the quick calculator, **trip budget per person**, **search & filter** expenses, **duplicate** an expense.
- Install button (PWA) and an FAQ.

### 🤝 Live sharing
Turn on live sharing for a group and send the link: everyone who opens it sees new expenses instantly and can add their own, even offline (changes sync when they're back online). It runs on Firebase Cloud Firestore. The long random id in the link is the only key, and nobody can list or search groups (see `firestore.rules`). Without a Firebase config the feature is hidden and everything else works as before.

### 🛡️ Keeping data safe
Groups live on the device. The app asks the browser for persistent storage, shows iPhone users how to add it to the Home Screen (Safari can clear site data after 7 days), and reminds people to download a backup.

### 🔎 SEO
The build (`seo/`) writes:
- a crawlable landing page for each language (`/`, `/zh-hk/`, `/zh-cn/`, `/ja/`, `/ko/`, `/th/`, `/es/`, `/fr/`, `/de/`) with a localised title, description, FAQ, tipping table, hreflang links, Open Graph image and JSON-LD
- a **tipping guide page for every country in every language** (`/ja/tipping/us/` …, about 300 pages). Each has the local service charge, tax and tipping custom, a worked dinner-for-four example, FAQ + breadcrumb JSON-LD, and a button that opens the calculator with that country's presets
- privacy, terms and about pages, a 404 page, `sitemap.xml` and `robots.txt`

These content pages are plain HTML (no app JavaScript), so they load fast and are easy to crawl.

### ☕ Support
EasySplit is free and ad-free. If it helps you, you can support it on [Ko-fi](https://ko-fi.com/beyond01hk).

### 🌍 Made for everywhere
- 30+ country presets: currency, typical service charge, VAT/GST/sales tax, tipping custom and local payment apps. Every value stays editable.
- Correct decimals for each currency (JPY/KRW have none; TWD/IDR are rounded the way people actually pay).
- 9 languages: English, 繁體中文, 简体中文, 日本語, 한국어, ไทย, Español, Français, Deutsch. Country and currency names are localised automatically.
- Mobile-first, dark mode, installable as an app (PWA), and works offline.
- Your data stays on your device. No account needed.

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · vite-plugin-pwa · Vitest

```
src/
  lib/         pure logic: money (exact cents), bill (extras), settle (balances), countries, rates, share
  state/       tiny store persisted to localStorage
  i18n/        translations
  components/  UI building blocks, pickers, charges editor
  screens/     Home, QuickSplit, Group (expenses / settle up / stats / people), Import
```

All money maths runs in integer minor units, using largest-remainder allocation, so shares always add up exactly to the total.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000/-EasySplit-HK-/
npm test               # unit tests (bill maths, settlement, sync model)
npm run test:emulator  # live-sharing tests against the Firestore emulator (needs Java)
npm run test:e2e       # Playwright UI tests, incl. two browsers sharing a live group
npm run build          # type-check + production build
npm run deploy         # publish dist/ to GitHub Pages by hand
```

## Live sharing setup (Firebase)

1. Create a free project at <https://console.firebase.google.com> (Analytics can stay off).
2. **Build → Firestore Database → Create database** in production mode. Pick a region near your users (e.g. `asia-east2`, Hong Kong).
3. Open the **Rules** tab, paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
4. **Project settings → General → Your apps → Web (`</>`)**: register an app and copy `apiKey`, `authDomain`, `projectId` and `appId`.
5. In GitHub: **Settings → Secrets and variables → Actions → Variables**, add `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID` and `FIREBASE_APP_ID`. These values are public by design, so variables are fine.
6. Run **Actions → Test & deploy → Run workflow**. The live sharing option appears in each group's ⋯ menu.

Recommended: in Google Cloud Console, restrict the API key to your site's domain, and set a budget alert. The free Spark plan covers small groups comfortably.

For local development, put the same values in `.env.local` as `VITE_FIREBASE_API_KEY=…` and so on.

## Deployment

Every push to `main` runs the tests, builds the app and publishes `dist/` to the `gh-pages` branch through GitHub Actions (`.github/workflows/deploy.yml`). Pull requests run the tests and build only.

Live site: https://bill2712.github.io/-EasySplit-HK-/
