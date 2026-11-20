# PrimeVest frontend

Responsive React/Vite client for the PrimeVest API.

## Run locally

1. Start the backend with its MongoDB and JWT environment configured:

   ```sh
   cd backend
   npm start
   ```

2. In another terminal, install and start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

The Vite development server proxies `/api` and `/health` to `http://localhost:4000`. Set `VITE_API_URL` to the API origin when deploying the frontend separately; configure the backend's `FRONTEND_ORIGIN` to match the deployed site.

The client uses the backend for authentication, account data, activity, alerts, and administrator tools. The Wallet view provides Send, Receive, and Withdraw flows using the available account routes: Send and Withdraw record an outgoing ledger entry, while Receive displays the configured funding address. The API does not accept a destination address, execute on-chain transfers, monitor deposits, or automatically credit them. Admins can manage shared funding addresses and per-user flat USD withdrawal-fee metadata. When a fee is required, withdrawal fields stay locked until an admin manually verifies payment and marks it paid; the API does not verify, collect, or deduct the fee.

The Wallet market tracker shows indicative public prices for BTC, ETH, USDT, and SOL. Simulated investments are persisted by the backend: placing one reserves the selected wallet balance, tracks hypothetical 8% compounding for each complete five-day period, and allows redemption after a 30-day lock. These records are simulations only; they do not represent real investments, trades, custody, or returns. The assumed rate is not guaranteed.

Indicative asset prices in the selected display currency come from CoinGecko's public simple-price endpoint; they are not supplied by the backend and are not executable quotes. Account activity updates balances in the API but does not execute an exchange order, transfer, or payment.
