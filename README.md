# Smart Reorder MVP

Smart Reorder is a personalised nudge engine layered on top of a grocery purchase history. It surfaces the right items at the right time, learns a user's rhythm, handles bulk-order anomalies gracefully, and offers a private incognito mode for sensitive purchases.

This MVP is built for a mobile-first grocery app (like Instamart or Kirana) based on a Product Requirements Document (PRD).

## Key Features

1. **In-app Nudge Card**: Proactively suggests items you usually buy, based on a rolling average of your purchase gaps.
2. **Anomaly Detection**: Detects unusually large orders (e.g., bulk stock-ups or parties) at checkout and asks you to label them. If labelled, normal nudges are paused so your everyday recommendations don't get skewed.
3. **Incognito Mode**: Buy items privately without them influencing your personalisation profile.

## Tech Stack

- **Frontend**: Next.js (React), Vanilla CSS (Mobile-first design)
- **Backend**: Next.js App Router API Routes
- **Database**: SQLite (via Prisma ORM)

## Screenshots

### Home & Nudge Card
The nudge card appears on the home feed when you have items that are overdue based on your normal buying rhythm.

![Home Page & Nudges](assets/screenshot_home.png)

### Cart & Incognito Mode
A toggle in the cart allows you to activate incognito mode. The theme shifts, and purchases in this session won't impact your future nudges.

![Cart Incognito](assets/screenshot_cart_incognito.png)

### Anomaly Bottom Sheet
If you check out with significantly more items than your 90-day average, an anomaly sheet surfaces to categorize the bulk order.

![Anomaly Sheet](assets/screenshot_anomaly_sheet.png)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Push the schema and seed the database:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Database Schema Highlights

- `UserItemProfile`: Tracks the `avg_days_between` purchases and the `next_nudge_at` date for each SKU.
- `SessionEvent`: Captures the checkout context, including `is_incognito` and `item_count`.
- `AnomalySession`: Records when an anomaly occurs and suppresses nudges until a specific time.
