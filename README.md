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

### 🔎 SEO
The build (`seo/plugin.ts`) writes a crawlable landing page for each language (`/`, `/zh-hk/`, `/zh-cn/`, `/ja/`, `/ko/`, `/th/`, `/es/`, `/fr/`, `/de/`). Each page has a localised title and description, FAQ, tipping table, hreflang links, Open Graph image and JSON-LD (WebApplication + FAQPage). The build also writes `sitemap.xml` and `robots.txt`.

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
npm run dev        # http://localhost:3000/-EasySplit-HK-/
npm test           # unit tests for the bill & settlement maths
npm run build      # type-check + production build
npm run deploy     # publish dist/ to GitHub Pages by hand
```

## Deployment

Every push to `main` runs the tests, builds the app and publishes `dist/` to the `gh-pages` branch through GitHub Actions (`.github/workflows/deploy.yml`). Pull requests run the tests and build only.

Live site: https://bill2712.github.io/-EasySplit-HK-/
