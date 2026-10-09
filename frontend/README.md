# NurtureHer Frontend

Premium React 18 dashboard for the NurtureHer women’s health platform.

## Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Radix UI
- React Hook Form
- Framer Motion
- React Query
- Lucide Icons
- Recharts
- React Router

## Run

```bash
npm install
npm run dev
```

During development, Vite proxies `/api` requests to the FastAPI server at `http://127.0.0.1:8000`, so the browser uses a same-origin API URL. Set `VITE_API_BASE_URL` when the frontend is deployed behind a different API route.

## Build

```bash
npm run build
```
