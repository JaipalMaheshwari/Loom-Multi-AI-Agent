# Agent UI (Next.js)

Tumhare self-learning agent ke FastAPI backend ke liye Claude-jaisi chat UI —
warm cream background, terracotta accent, sidebar mein chat history.

## Setup (Mac)

Backend alag terminal window mein already chal raha hona chahiye
(`uvicorn main:app --reload --port 8000`). Yeh frontend usi se baat karta hai.

```bash
cd agent-ui
npm install
cp .env.local.example .env.local
npm run dev
```

Browser mein kholo: **http://localhost:3000**

Agar backend kisi doosre URL/port par chal raha ho, to `.env.local` mein
`NEXT_PUBLIC_API_BASE_URL` badal do.

## Structure

- `app/page.tsx` — poori chat screen (sidebar + messages + input) yahin se control hoti hai
- `components/Sidebar.tsx` — chat list, rename/delete, model status
- `components/MessageBubble.tsx` — user/assistant message ka look
- `components/Composer.tsx` — neeche wala message input
- `lib/api.ts` — backend ke saare `/api/*` endpoints ka wrapper

Design ko badalna ho to `tailwind.config.ts` mein colors hain
(`accent`, `cream`, `bubble` waghera) — wahin se poori theme control hoti hai.
