# Qurtaas Ink & Drink — Management System

A full-featured cafeteria management dashboard for **Qurtaas Ink & Drink** built with React + TypeScript + Tailwind CSS.

## Features

- 📊 **Dashboard** — Live KPIs, 7-day revenue trend, top items, hourly orders
- 🧾 **Sales Tracker** — Transaction log with filtering, role-gated sale recording
- 📈 **Reports** — Daily/weekly charts, category pie, peak-hour heatmap
- 🔍 **Analytics** — Profit margins, category performance, top & slow-moving items
- 🔮 **Predictions** — Linear regression + day-of-week seasonality, 30-day forecast
- ⚠️ **Drawbacks Finder** — Auto-detected business issues with recommendations
- 📣 **Marketing Planner** — 6 ready-to-launch campaigns with 30-day calendar
- 📦 **Inventory** — Stock levels, days-left countdown, reorder checklist
- 👥 **User Management** — Full RBAC with 5 roles managed by Super Admin

## Roles

| Role | Access |
|------|--------|
| Super Admin | All pages + user management |
| Admin | All pages except user management |
| Cashier | Dashboard + Sales |
| Accountant | Dashboard, Reports, Analytics, Predictions |
| Supply Manager | Dashboard, Inventory, Analytics |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Auth:** Role-based access control via React Context + localStorage
- **Deploy:** GitHub Pages via GitHub Actions

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```
