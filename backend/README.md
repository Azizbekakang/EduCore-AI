# EduCore AI backend

Node.js + Express + SQLite REST API. GitHub Pages faqat frontendni ishlatadi; backendni Render, Railway yoki VPS ga deploy qiling.

## Ishga tushirish

```bash
cd backend
cp .env.example .env
npm install
npm start
```

API manzili: `http://localhost:3000/api`

## Muhim xavfsizlik

`.env` faylini GitHub’ga yubormang. Admin parolini `.env` ichida o‘zgartiring. Bu backend frontenddagi `localStorage` ma’lumotlarini avtomatik ko‘chirmaydi.

## Asosiy endpointlar

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/courses`
- `GET /api/olympiads`
- `POST /api/olympiads` — admin
- `POST /api/olympiads/:id/questions` — admin
- `GET /api/problems`
- `POST /api/problems` — admin
- `GET /api/leaderboard`
- `GET /api/chats/:withUserId`
- `POST /api/chats/:withUserId/messages`
