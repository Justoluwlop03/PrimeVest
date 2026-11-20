# Deploy PrimeVest

PrimeVest uses Vercel for the Vite frontend, Render for the Node API, and MongoDB Atlas for persistent data. Deploy the API first, then configure and deploy the frontend.

## 1. Prepare MongoDB Atlas

Create or select a MongoDB database and copy its application connection string. Replace the username, password, and cluster host with real values. In Atlas, open **Network Access** and allow the Render service's outbound IP ranges. Find the ranges in the Render service under **Connect > Outbound**; add each CIDR range to the Atlas IP access list. Avoid `0.0.0.0/0` for production because it allows connection attempts from any IP.

## 2. Deploy the API to Render

1. In Render, create a Blueprint from `Justoluwlop03/PrimeVest` and select the `main` branch. Render reads the root `render.yaml` and sets the backend root directory, build command, start command, and `/health` health check. If you already created the service manually, update its settings instead of creating a duplicate: Root Directory `backend`, Build Command `npm ci`, Start Command `npm start`, and Health Check Path `/health`.
2. Enter the `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` values when Render requests them. `ADMIN_PASSWORD` must be 12 to 128 characters. Render generates `JWT_SECRET` for the service.
3. For `FRONTEND_ORIGIN`, enter a temporary URL for now; replace it with the Vercel production URL after the frontend deploys.
4. Wait for the service to deploy and copy its URL, such as `https://primevest-api.onrender.com`.

The API starts only after it connects to MongoDB, so Render reports a failed deploy if Atlas connectivity is unavailable. Keep the MongoDB URI and administrator password in Render's environment settings; never commit them to this repository.

## 3. Deploy the frontend to Vercel

1. Import `Justoluwlop03/PrimeVest` into Vercel and set **Root Directory** to `frontend`.
2. Set the Production environment variable `VITE_API_URL` to the Render service URL, with no trailing slash (for example, `https://primevest-api.onrender.com`).
3. Deploy and copy the resulting production domain, such as `https://primevest.vercel.app`.

The frontend's `vercel.json` sets the Vite build and output settings. A push to `main` triggers new deployments after the GitHub repository is connected to both providers.

## 4. Finish CORS setup

In the Render service's environment settings, set `FRONTEND_ORIGIN` to the exact Vercel production origin, including `https://` and without a trailing slash. Save the change and redeploy the API. The backend intentionally allows only this configured browser origin.

## 5. Sign in

Open the Vercel production URL and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured on Render. The backend provisions or refreshes that administrator account on startup.

Vercel preview deployments use different origins and are not allowed by the production API's single-origin CORS setting. Test the production deployment, or configure a separate preview API and origin if preview testing is needed.
