# PrimeVest

PrimeVest is a React/Vite cryptocurrency portfolio interface backed by a Node.js API and MongoDB. The frontend and API are deployed separately: Vercel hosts the frontend, Render hosts the API, and MongoDB Atlas stores account data.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel and Render setup steps.

## Local development

- Start the API from `backend` with `npm run dev` after configuring `backend/.env`.
- Start the frontend from `frontend` with `npm install` and `npm run dev`.
- The Vite development server proxies API requests to `http://localhost:4000`.

Keep `backend/.env` and local database files out of Git. Use the hosting provider's environment settings for deployed secrets.
