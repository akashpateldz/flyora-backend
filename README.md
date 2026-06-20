# Flyora Backend API ✈️

> Premium Luggage Sharing Marketplace — Backend REST API

Built with **Node.js + Express + TypeScript** following clean architecture principles.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start development server
npm run dev
```

The API will be available at `http://localhost:5000`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | API health check + uptime |
| `GET` | `/api/stats` | Platform statistics |
| `GET` | `/api/routes` | Popular shipping routes |
| `GET` | `/api/routes?popular=true` | Only popular routes |
| `GET` | `/api/features` | Platform features |
| `GET` | `/api/features?category=trust` | Features by category |
| `GET` | `/api/landing` | All landing page data |
| `POST` | `/api/waitlist` | Join waitlist |
| `GET` | `/api/waitlist/count` | Get waitlist count |

### POST /api/waitlist

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "traveler"
}
```

**Role options:** `traveler` | `sender` | `both`

---

## 🗂️ Project Structure

```
flyora-backend/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── controllers/
│   │   ├── health.controller.ts
│   │   ├── landing.controller.ts
│   │   └── waitlist.controller.ts
│   ├── routes/
│   │   ├── index.ts            # Main router
│   │   ├── health.routes.ts
│   │   ├── landing.routes.ts
│   │   └── waitlist.routes.ts
│   ├── services/
│   │   ├── landing.service.ts  # Mock data layer
│   │   └── waitlist.service.ts
│   ├── middlewares/
│   │   ├── error.middleware.ts
│   │   └── notFound.middleware.ts
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── app.ts                  # Express app factory
│   └── server.ts               # Server entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | Server port |
| `HOST` | `localhost` | Server hostname |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS allowed origins |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

---

## 🔒 Security Features

- **Helmet** — HTTP security headers
- **CORS** — Origin whitelist
- **Rate Limiting** — 100 req/15min per IP
- **Input Validation** — Email format & role validation
- **Error Sanitization** — No stack traces in production

---

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Language:** TypeScript 5
- **Security:** Helmet, CORS, express-rate-limit
- **Logging:** Morgan
- **Dev Tools:** ts-node-dev

---

*Flyora — Your Journey Carries More Than You.*
