import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, Check,
  ChevronDown, ChevronRight, CircleDollarSign, CircleHelp, Clock3, Copy, Eye, EyeOff,
  FileClock, LayoutDashboard, LoaderCircle, LockKeyhole, LogOut, Mail, Menu, Moon,
  MoreHorizontal, Plus, Search, Send, Settings, ShieldCheck, Sun, TrendingDown, TrendingUp,
  Users, Wallet, X,
} from 'lucide-react'
import { api, jsonBody } from './api.js'

const TOKEN_KEY = 'bluevault_token'
const THEME_KEY = 'bluevault_theme'
const COINS = [
  { ticker: 'BTC', name: 'Bitcoin', id: 'bitcoin', color: '#f7931a', mark: '₿' },
  { ticker: 'ETH', name: 'Ethereum', id: 'ethereum', color: '#6978d1', mark: 'Ξ' },
  { ticker: 'USDT', name: 'Tether', id: 'tether', color: '#26a17b', mark: '₮' },
  { ticker: 'SOL', name: 'Solana', id: 'solana', color: '#8757e8', mark: '◎' },
]
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR']
const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Ctether%2Csolana&vs_currencies=usd%2Ceur%2Cgbp%2Ccad%2Caud%2Cjpy%2Cchf%2Cinr&include_24hr_change=true'

function money(value, currency = 'USD', maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits }).format(value)
  } catch {
    return `${currency} ${value.toFixed(maximumFractionDigits)}`
  }
}

function coinPrice(prices, ticker, currency) {
  const coin = COINS.find(item => item.ticker === ticker)
  return coin ? prices[coin.id]?.[currency.toLowerCase()] : undefined
}

function balancesWithActiveInvestments(balances, investments) {
  const combined = { ...balances }
  investments.forEach(item => {
    if (item.status === 'active') combined[item.ticker] = Number(combined[item.ticker] || 0) + Number(item.currentValue || 0)
  })
  return combined
}

function shortDate(value, options = { month: 'short', day: 'numeric' }) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, options).format(date)
}

function IconCoin({ ticker, size = 38 }) {
  const coin = COINS.find(item => item.ticker === ticker)
  const logos = {
    BTC: <svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="20" fill="#f7931a" /><text x="20" y="28" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700">₿</text></svg>,
    ETH: <svg viewBox="0 0 40 40" focusable="false"><path fill="#9ca7c5" d="M20 2 7 21l13-6z" /><path fill="#6876a0" d="M20 2v13l13 6z" /><path fill="#7d89ad" d="m7 23 13 15V18z" /><path fill="#4d5b82" d="m20 18 13 5-13 15z" /><path fill="#aab4cf" d="m7 21 13-6v8z" /><path fill="#59688f" d="m20 15 13 6-13 2z" /></svg>,
    USDT: <svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="20" fill="#26a17b" /><path fill="#fff" d="M8 9h24v5h-9v3.2c7.1.3 12 1.4 12 2.8s-4.9 2.5-12 2.8V31h-6v-8.2c-7.1-.3-12-1.4-12-2.8s4.9-2.5 12-2.8V14H8zm11 8.3c-6.1.2-10 .9-10 1.7s3.9 1.5 10 1.7zm2 0v3.4c6.1-.2 10-.9 10-1.7s-3.9-1.5-10-1.7" /></svg>,
    SOL: <svg viewBox="0 0 40 40" focusable="false"><defs><linearGradient id="solana-gradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#80f1b5" /><stop offset="1" stopColor="#9945ff" /></linearGradient></defs><path fill="url(#solana-gradient)" d="M8 9h26l-4 5H4zM6 17h26l-4 5H2zM8 25h26l-4 5H4z" /></svg>,
  }
  return (
    <span className="coin-icon" style={{ '--coin-color': coin?.color || '#74839a', width: size, height: size, fontSize: size * 0.48 }} aria-hidden="true">
      {logos[ticker] || ticker?.slice(0, 1) || '?'}
    </span>
  )
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
      <span>PrimeVest</span>
    </div>
  )
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'register') {
        await api('/api/auth/register', { method: 'POST', body: jsonBody({ name, email, password }) })
      }
      const result = await api('/api/auth/login', { method: 'POST', body: jsonBody({ email, password }) })
      onLogin(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-story-inner">
          <Brand />
          <div className="story-copy">
            <div className="eyebrow"><span className="status-dot" /> YOUR PORTFOLIO, IN FOCUS</div>
            <h1>A clearer view<br />of your <span>crypto.</span></h1>
            <p>One calm, considered place to keep up with your digital assets and account activity.</p>
            <div className="story-card">
              <div className="story-card-top"><span>ACCOUNT PREVIEW</span><span className="story-live">ILLUSTRATIVE</span></div>
              <div className="story-card-balance">$24,680<span>.42</span></div>
              <div className="story-chart" aria-hidden="true"><svg viewBox="0 0 480 110" preserveAspectRatio="none"><path d="M0 83 C30 77 43 90 72 67 S111 70 137 57 173 70 202 47 240 60 268 41 307 52 334 30 377 45 402 21 444 31 480 8" /><path className="chart-fill" d="M0 83 C30 77 43 90 72 67 S111 70 137 57 173 70 202 47 240 60 268 41 307 52 334 30 377 45 402 21 444 31 480 8 V110 H0 Z" /></svg></div>
              <div className="story-card-bottom"><span>Illustrative preview</span><span>◈ &nbsp; ₿ &nbsp; Ξ &nbsp; ◎</span></div>
            </div>
          </div>
          <div className="auth-footer"><span>Built for a better overview.</span><span>© PrimeVest {new Date().getFullYear()}</span></div>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><Brand /></div>
          <div className="auth-form-heading">
            <div className="auth-icon"><LockKeyhole size={20} /></div>
            <p className="eyebrow">WELCOME {mode === 'login' ? 'BACK' : 'ABOARD'}</p>
            <h2>{mode === 'login' ? 'Sign in to PrimeVest' : 'Create your account'}</h2>
            <p className="muted">{mode === 'login' ? 'Your portfolio is right where you left it.' : 'Start with a secure account in just a moment.'}</p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <label>Full name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Alex Morgan" maxLength={100} required /></label>}
            <label>Email address<div className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" maxLength={254} required /></div></label>
            <label>Password<div className="input-with-icon"><LockKeyhole size={17} /><input type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} maxLength={128} required /><button className="icon-button input-action" type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary button-wide" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : null}{mode === 'login' ? 'Sign in securely' : 'Create account'}<ChevronRight size={17} /></button>
          </form>
          <div className="auth-switch">{mode === 'login' ? 'New to PrimeVest?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
          <div className="auth-security"><ShieldCheck size={16} /><span>Your account is protected with encrypted authentication.</span></div>
        </div>
      </section>
    </main>
  )
}

function Modal({ title, description, onClose, children, wide = false }) {
  useEffect(() => {
    function onKey(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        {children}
      </section>
    </div>
  )
}

function PortfolioChart({ activities, prices, currency }) {
  const points = useMemo(() => {
    const records = [...activities].filter(item => item.createdAt).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (!records.length) return []
    const balances = {}
    for (const [ticker, amount] of Object.entries(records.reduce((sum, item) => {
      sum[item.ticker] = (sum[item.ticker] || 0) + (item.type === 'received' || item.type === 'bought' ? Number(item.amount) : -Number(item.amount))
      return sum
    }, {}))) balances[ticker] = amount
    let running = Object.fromEntries(Object.entries(balances).map(([ticker, amount]) => [ticker, Math.max(0, amount)]))
    const history = records.map(item => {
      return { createdAt: item.createdAt, value: Object.entries(running).reduce((sum, [ticker, amount]) => {
        const quote = coinPrice(prices, ticker, currency)
        return sum + (quote ? amount * quote : 0)
      }, 0) }
    })
    for (let index = records.length - 1; index >= 0; index--) {
      const item = records[index]
      const delta = Number(item.amount) * (item.type === 'received' || item.type === 'bought' ? 1 : -1)
      running[item.ticker] = Math.max(0, (running[item.ticker] || 0) - delta)
      history[index].value = Object.entries(running).reduce((sum, [ticker, amount]) => {
        const quote = coinPrice(prices, ticker, currency)
        return sum + (quote ? amount * quote : 0)
      }, 0)
    }
    return history
  }, [activities, prices, currency])

  if (points.length < 2 || !COINS.some(coin => coinPrice(prices, coin.ticker, currency))) return <div className="chart-empty"><div className="empty-chart-icon"><Activity size={21} /></div><strong>Your portfolio story starts here</strong><span>As your activity grows, you’ll see your balance history here.</span></div>
  const values = points.map(item => item.value)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const spread = high - low || high || 1
  const width = 720
  const height = 220
  const coords = points.map((point, index) => ({
    x: (index / (points.length - 1)) * width,
    y: height - 14 - ((point.value - low) / spread) * (height - 28),
  }))
  const line = coords.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Estimated portfolio value history">
        <defs><linearGradient id="portfolio-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3979ee" stopOpacity=".2" /><stop offset="100%" stopColor="#3979ee" stopOpacity="0" /></linearGradient></defs>
        {[.25, .5, .75].map(value => <line key={value} x1="0" x2={width} y1={height * value} y2={height * value} className="chart-grid" />)}
        <path d={area} fill="url(#portfolio-fill)" />
        <path d={line} className="chart-line" />
        {coords.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3" className="chart-point" />)}
      </svg>
      <div className="chart-dates"><span>{shortDate(points[0].createdAt)}</span><span>{shortDate(points[points.length - 1].createdAt)}</span></div>
      <p className="chart-caption">Estimated from activity and current prices · {currency}</p>
    </div>
  )
}

function ActivityTable({ activities, currency, prices, compact = false }) {
  const rows = compact ? activities.slice(0, 5) : activities
  if (!rows.length) return <div className="empty-state"><div className="empty-state-icon"><FileClock size={21} /></div><strong>No activity yet</strong><span>Your account activity will show up here.</span></div>
  return (
    <div className="table-scroll">
      <table className="activity-table"><thead><tr><th>Activity</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{rows.map(item => {
          const incoming = item.type === 'received' || item.type === 'bought'
          const quote = coinPrice(prices, item.ticker, currency)
          return <tr key={item.id}>
            <td><div className="activity-name"><IconCoin ticker={item.ticker} size={36} /><span><strong>{item.title || item.type}</strong><small>{item.ticker} · {item.type}</small></span></div></td>
            <td><span className="table-date">{shortDate(item.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span></td>
            <td><span className={incoming ? 'amount-positive' : 'amount-neutral'}>{incoming ? '+' : '−'}{Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.ticker}</span><small className="amount-fiat">{quote ? money(Number(item.amount) * quote, currency) : '—'}</small></td>
            <td><span className="status-pill status-completed"><span />{item.status || 'Completed'}</span></td>
          </tr>
        })}</tbody>
      </table>
    </div>
  )
}

function ActivityModal({ onClose, onSubmit, busy, error, balances }) {
  const [type, setType] = useState('bought')
  const [ticker, setTicker] = useState('BTC')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  return <Modal title="Record account activity" description="Keep your portfolio activity up to date." onClose={onClose}>
    <form className="modal-form" onSubmit={event => { event.preventDefault(); onSubmit({ type, ticker, amount: Number(amount), title: title.trim() || `${type[0].toUpperCase()}${type.slice(1)} ${ticker}` }) }}>
      <label>Activity type<select value={type} onChange={event => setType(event.target.value)}><option value="bought">Bought</option><option value="sold">Sold</option></select></label>
      <label>Asset<select value={ticker} onChange={event => setTicker(event.target.value)}>{COINS.map(coin => <option value={coin.ticker} key={coin.ticker}>{coin.name} ({coin.ticker})</option>)}</select></label>
      {type === 'sold' && <p className="available-note">Available: {Number(balances[ticker] || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} {ticker}</p>}
      <label>Amount<input type="number" step="any" min="0.00000001" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required /></label>
      <label>Note <span className="label-optional">OPTIONAL</span><input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder="Add a note" /></label>
      <div className="notice-box"><CircleHelp size={17} /><span>This records an activity and updates your account balance. The connected backend does not execute exchange trades, transfers, or payments.</span></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}Save activity</button></div>
    </form>
  </Modal>
}

function WalletActions({ onSend, onReceive, onWithdraw }) {
  return <div className="wallet-actions">
    <button className="button button-primary" onClick={onSend}><Send size={16} />Send</button>
    <button className="button button-secondary" onClick={onReceive}><ArrowDownLeft size={16} />Receive</button>
    <button className="button button-secondary" onClick={onWithdraw}><ArrowUpRight size={16} />Withdraw</button>
  </div>
}

function ReceiveModal({ user, token, onClose, onUserUpdated }) {
  const [receiveUser, setReceiveUser] = useState(user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/api/auth/me', { token })
      .then(result => {
        if (!active) return
        setReceiveUser(result.user)
        onUserUpdated(result.user)
      })
      .catch(requestError => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [token, onUserUpdated])

  return <Modal title="Receive crypto" description="Use a deposit address configured for your account." onClose={onClose}>
    <div className="receive-modal-content">
      {loading ? <div className="loading-panel"><LoaderCircle className="spin" size={20} />Refreshing deposit addresses…</div> : error ? <div className="form-error" role="alert">Couldn’t load the latest receive addresses: {error}</div> : <DepositAddresses user={receiveUser} />}
    </div>
  </Modal>
}

function getDepositWallet(user, ticker) {
  const wallet = user.depositAddresses?.[ticker]
  if (wallet?.address) return wallet
  if (user.depositAsset === ticker && user.depositAddress) return { address: user.depositAddress, network: user.network }
  return null
}

function OutgoingModal({ action, user, token, prices, onClose, onSubmit, onUserUpdated, busy, error }) {
  const [ticker, setTicker] = useState('BTC')
  const [amount, setAmount] = useState('')
  const [currentUser, setCurrentUser] = useState(user)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const isWithdraw = action === 'withdraw'
  const assetAmount = Number(amount)
  const available = Number(currentUser.balances?.[ticker] || 0)
  const feeAmount = Number(currentUser.fee) || 0
  const feeRequired = isWithdraw && currentUser.feeStatus === 'active' && feeAmount > 0
  const feePaid = isWithdraw && currentUser.feeStatus === 'paid' && feeAmount > 0
  const fieldsDisabled = loading || Boolean(loadError) || feeRequired
  const feeUsdtPrice = coinPrice(prices, 'USDT', 'USD') || 1
  const usdtWallet = getDepositWallet(currentUser, 'USDT')

  useEffect(() => {
    let active = true
    api('/api/auth/me', { token })
      .then(result => {
        if (!active) return
        setCurrentUser(result.user)
        onUserUpdated(result.user)
      })
      .catch(requestError => {
        if (active) setLoadError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [token, onUserUpdated])

  async function copyFeeAddress() {
    setCopyError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.')
      await navigator.clipboard.writeText(usdtWallet.address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch (copyRequestError) {
      setCopyError(copyRequestError.message)
    }
  }

  return <Modal title={isWithdraw ? 'Withdraw crypto' : 'Send crypto'} description={isWithdraw ? 'Review your withdrawal amount and fee.' : 'Record an outgoing wallet transfer.'} onClose={onClose}>
    <form className="modal-form" onSubmit={event => { event.preventDefault(); onSubmit({ ticker, amount: assetAmount, title: isWithdraw ? `Withdrawal ${ticker}` : `Sent ${ticker}` }) }}>
      {loading && <div className="loading-panel"><LoaderCircle className="spin" size={18} />Checking your latest withdrawal settings…</div>}
      {loadError && <div className="form-error" role="alert">Couldn’t load the latest withdrawal settings: {loadError}</div>}
      <label>Asset<select disabled={fieldsDisabled} value={ticker} onChange={event => setTicker(event.target.value)}>{COINS.map(coin => <option value={coin.ticker} key={coin.ticker}>{coin.name} ({coin.ticker})</option>)}</select></label>
      <div className="available-note">Available balance: {available.toLocaleString(undefined, { maximumFractionDigits: 8 })} {ticker}</div>
      <label>Amount<input disabled={fieldsDisabled} type="number" step="any" min="0.00000001" max={available} value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required /></label>
      {isWithdraw && currentUser.feeStatus === 'active' && feeAmount > 0 && <div className="withdraw-fee-card">
        <div className="withdraw-fee-title"><CircleDollarSign size={17} /><strong>{currentUser.feeTitle || 'Withdrawal fee'}</strong><span className="fee-required-pill">Payment required</span></div>
        <div className="withdraw-fee-amount">{money(feeAmount, 'USD')}<span>≈ {(feeAmount / feeUsdtPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span></div>
        {currentUser.feeDescription && <p>{currentUser.feeDescription}</p>}
        {usdtWallet ? <div className="fee-address-box"><div><strong>Pay in USDT to this address</strong><small>{usdtWallet.network || 'USDT network'}</small><code title={usdtWallet.address}>{usdtWallet.address}</code></div><button type="button" className="button button-secondary button-small" onClick={copyFeeAddress}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy address'}</button></div> : <div className="form-error fee-address-error" role="alert">No USDT wallet address is configured. Contact an administrator; withdrawals remain locked.</div>}
        {copyError && <div className="form-error fee-address-error" role="alert">{copyError}</div>}
        <p className="fee-unlock-note">Withdrawal fields unlock after an admin verifies your payment and marks the fee as paid.</p>
      </div>}
      {isWithdraw && feePaid && <div className="withdraw-fee-card fee-paid-card"><div className="withdraw-fee-title"><CircleDollarSign size={17} /><strong>{currentUser.feeTitle || 'Withdrawal fee'}</strong><span className="fee-paid-pill">Payment verified</span></div><div className="withdraw-fee-amount">{money(feeAmount, 'USD')}<span>Fee confirmed by an administrator</span></div>{currentUser.feeDescription && <p>{currentUser.feeDescription}</p>}</div>}
      {isWithdraw && currentUser.feeStatus === 'inactive' && <div className="withdraw-fee-card"><div className="withdraw-fee-title"><CircleDollarSign size={17} /><strong>No withdrawal fee required</strong></div></div>}
      <div className="notice-box"><CircleHelp size={17} /><span>{isWithdraw ? 'This action records an outgoing balance change only; it does not submit a blockchain withdrawal.' : 'This action records an outgoing balance change only. The backend does not accept a destination address or submit an external transfer.'}</span></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy || fieldsDisabled || !assetAmount || assetAmount > available}>{busy ? <LoaderCircle size={16} className="spin" /> : null}{isWithdraw ? 'Record withdrawal' : 'Record send'}</button></div>
    </form>
  </Modal>
}

function Sidebar({ page, setPage, user, open, onClose, onLogout }) {
  const links = [
    { key: 'portfolio', label: 'Wallet', icon: Wallet },
    { key: 'overview', label: 'Home', icon: LayoutDashboard },
    { key: 'activity', label: 'Activity', icon: ArrowLeftRight },
    { key: 'alerts', label: 'Alerts', icon: Bell },
  ]
  return <>
    {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="side-nav">{links.map(({ key, label, icon: Icon }) => <button key={key} className={`nav-item ${page === key ? 'nav-active' : ''}`} onClick={() => { setPage(key); onClose() }}><Icon size={18} /><span>{label}</span>{key === 'alerts' && <span className="nav-trailing"><ChevronRight size={15} /></span>}</button>)}</nav>
      {user.role === 'admin' && <><div className="sidebar-label admin-label">MANAGEMENT</div><nav className="side-nav"><button className={`nav-item ${page === 'admin' ? 'nav-active' : ''}`} onClick={() => { setPage('admin'); onClose() }}><Users size={18} /><span>Admin dashboard</span></button></nav></>}
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div className="help-icon"><ShieldCheck size={17} /></div><strong>Your account, protected</strong><span>Your account activity is private and secured.</span></div>
        <div className="sidebar-user"><div className="avatar">{(user.name || 'U').trim().slice(0, 1).toUpperCase()}</div><div className="sidebar-user-copy"><strong>{user.name}</strong><span>{user.role === 'admin' ? 'Administrator' : user.email}</span></div><ChevronDown size={16} /></div>
        <button className="sidebar-signout" onClick={onLogout}><LogOut size={17} /><span>Sign out</span></button>
      </div>
    </aside>
  </>
}

function MobileNav({ page, setPage }) {
  const links = [
    { key: 'overview', label: 'Home', icon: LayoutDashboard },
    { key: 'portfolio', label: 'Wallet', icon: Wallet },
    { key: 'activity', label: 'Activity', icon: ArrowLeftRight },
    { key: 'alerts', label: 'Alerts', icon: Bell },
  ]
  return <nav className="mobile-bottom-nav" aria-label="Main navigation">
    {links.map(({ key, label, icon: Icon }) => <button key={key} className={page === key ? 'mobile-nav-active' : ''} onClick={() => setPage(key)} aria-current={page === key ? 'page' : undefined}><Icon size={19} /><span>{label}</span></button>)}
  </nav>
}

function Topbar({ user, pageTitle, theme, toggleTheme, onLogout, onMenu, onProfile }) {
  const [open, setOpen] = useState(false)
  return <header className="topbar">
    <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
    <div className="breadcrumb"><span>PrimeVest</span><ChevronRight size={15} /><strong>{pageTitle}</strong></div>
    <div className="topbar-actions"><div className="market-chip"><span className="status-dot" />Markets <span className="market-live">Live</span></div>
      <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      <button className="topbar-avatar" onClick={() => setOpen(value => !value)} aria-label="Open account menu">{(user.name || 'U').trim().slice(0, 1).toUpperCase()}</button>
      {open && <div className="account-menu"><div className="account-menu-user"><strong>{user.name}</strong><span>{user.email}</span></div><button onClick={() => { setOpen(false); onProfile() }}><Settings size={16} />Account settings</button><button className="logout-item" onClick={onLogout}><LogOut size={16} />Sign out</button></div>}
    </div>
  </header>
}

function AssetCards({ balances, prices, currency, onSelect }) {
  return <div className="asset-grid">{COINS.map(coin => {
    const amount = Number(balances[coin.ticker] || 0)
    const quote = prices[coin.id]
    const price = coinPrice(prices, coin.ticker, currency)
    const Card = onSelect ? 'button' : 'article'
    return <Card className="asset-card" key={coin.ticker} onClick={onSelect ? () => onSelect(coin.ticker) : undefined}>
      <div className="asset-card-top"><IconCoin ticker={coin.ticker} /><span className={`change-pill ${(quote?.usd_24h_change || 0) >= 0 ? 'change-up' : 'change-down'}`}>{quote ? <>{(quote.usd_24h_change || 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(quote.usd_24h_change || 0).toFixed(2)}%</> : '—'}</span></div>
      <strong className="asset-name">{coin.name}</strong><span className="asset-ticker">{coin.ticker}</span>
      <div className="asset-balance">{amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}<span> {coin.ticker}</span></div>
      <div className="asset-card-footer"><span>{price ? money(price, currency, price < 1 ? 4 : 2) : 'Price unavailable'}</span><span className="asset-value">{price ? money(price * amount, currency) : '—'}</span></div>
    </Card>
  })}</div>
}

function MarketTracker({ balances, prices, currency, loading }) {
  const hasMarketData = COINS.some(coin => coinPrice(prices, coin.ticker, currency) !== undefined)
  return <section className="panel market-tracker-panel">
    <div className="panel-heading"><div><h2>Crypto market</h2><p>Live indicative prices and 24-hour movement.</p></div><span className="market-refresh"><span className="status-dot" />Auto-refreshes every minute</span></div>
    {!hasMarketData && !loading ? <div className="market-unavailable">Market quotes are currently unavailable.</div> : <div className="table-scroll"><table className="market-table"><thead><tr><th>Asset</th><th>Price</th><th>24h</th><th>Your balance</th><th>Estimated value</th></tr></thead><tbody>{COINS.map(coin => {
      const price = coinPrice(prices, coin.ticker, currency)
      const change = prices[coin.id]?.usd_24h_change
      const balance = Number(balances[coin.ticker] || 0)
      return <tr key={coin.ticker}><td><div className="market-asset"><IconCoin ticker={coin.ticker} size={32} /><span><strong>{coin.name}</strong><small>{coin.ticker}</small></span></div></td><td>{price !== undefined ? money(price, currency, price < 1 ? 4 : 2) : loading ? 'Loading…' : '—'}</td><td>{Number.isFinite(change) ? <span className={`market-change ${change >= 0 ? 'positive' : 'negative'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span> : '—'}</td><td>{balance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {coin.ticker}</td><td>{price !== undefined ? money(price * balance, currency) : '—'}</td></tr>
    })}</tbody></table></div>}
    <p className="market-tracker-note">Prices from CoinGecko. Indicative only; not executable quotes.</p>
  </section>
}

function InvestmentManager({ user, investments, token, prices, currency, busy, error, onInvest, onRedeem, onInvestmentsRefreshed }) {
  const balances = user.balances || {}
  const [ticker, setTicker] = useState('BTC')
  const [amount, setAmount] = useState(String(Number(balances.BTC || 0)))
  const [trackerError, setTrackerError] = useState('')
  const available = Number(balances[ticker] || 0)
  const investment = Number(amount)
  const validAmount = Number.isFinite(investment) && investment >= 0.00000001 && Math.round(investment * 1e8) / 1e8 === investment && investment <= available
  const projected = validAmount ? investment * Math.pow(1.08, 6) : 0
  const gain = projected - investment
  const quote = coinPrice(prices, ticker, currency)
  const activeInvestments = investments.filter(item => item.status === 'active')
  const closedInvestments = investments.filter(item => item.status === 'closed')

  function changeTicker(event) {
    const nextTicker = event.target.value
    setTicker(nextTicker)
    setAmount(String(Number(balances[nextTicker] || 0)))
  }

  const refreshInvestments = useCallback(async () => {
    try {
      const result = await api('/api/investments', { token })
      onInvestmentsRefreshed(result.investments)
      setTrackerError('')
    } catch (requestError) {
      setTrackerError(requestError.message)
    }
  }, [token, onInvestmentsRefreshed])

  useEffect(() => {
    const timer = window.setInterval(refreshInvestments, 60000)
    return () => window.clearInterval(timer)
  }, [refreshInvestments])

  async function submitInvestment(event) {
    event.preventDefault()
    if (await onInvest({ ticker, amount: investment })) setAmount('')
  }

  return <section className="panel investment-simulator">
    <div className="panel-heading investment-heading"><div><h2>Simulated investments</h2><p>Place and track a 30-day investment simulation.</p></div><button type="button" className="text-button" onClick={refreshInvestments}><Activity size={14} />Refresh</button></div>
    <form className="investment-form" onSubmit={submitInvestment}>
      <div className="simulator-controls">
        <label>Asset<select value={ticker} onChange={changeTicker}>{COINS.map(coin => <option value={coin.ticker} key={coin.ticker}>{coin.name} ({coin.ticker})</option>)}</select></label>
        <label>Amount to invest<input type="number" min="0.00000001" max={available} step="any" value={amount} onChange={event => setAmount(event.target.value)} /><small>Available: {available.toLocaleString(undefined, { maximumFractionDigits: 8 })} {ticker}</small></label>
        <div className="investment-lock-summary"><span>Lock period</span><strong>30 days</strong><small>6 simulated 5-day periods</small></div>
      </div>
      <div className="simulator-result">
        <div><span>Illustrative value at day 30</span><strong>{validAmount ? `${projected.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${ticker}` : '—'}</strong>{validAmount && quote !== undefined && <small>{money(projected * quote, currency)} at today’s indicative price</small>}</div>
        <div><span>Illustrative gain</span><strong>{validAmount ? `+${gain.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${ticker}` : '—'}</strong><small>Assumes 8% compounded every 5 days</small></div>
      </div>
      {!validAmount && <p className="simulator-validation">Enter at least 0.00000001, using no more than 8 decimal places and no more than your available balance.</p>}
      {error && <div className="form-error" role="alert">{error}</div>}
      {trackerError && <div className="form-error" role="alert">Couldn’t refresh investments: {trackerError}</div>}
      <button className="button button-primary investment-submit" disabled={busy || !validAmount}>{busy && <LoaderCircle size={16} className="spin" />}Place simulated investment</button>
    </form>
    <div className="investment-list-section">
      <div className="investment-list-heading"><div><h3>Your investments</h3><span>{investments.length} position{investments.length === 1 ? '' : 's'}</span></div></div>
      {!investments.length ? <div className="investment-empty"><Wallet size={20} /><strong>No investments yet</strong><span>Place a simulation above to start tracking a position.</span></div> : <div className="investment-list">{[...activeInvestments, ...closedInvestments].map(item => {
        const coin = COINS.find(value => value.ticker === item.ticker)
        const price = coinPrice(prices, item.ticker, currency)
        const status = item.status === 'closed' ? 'Redeemed' : item.canRedeem ? 'Ready to redeem' : `Locked until ${shortDate(item.maturesAt, { month: 'short', day: 'numeric', year: 'numeric' })}`
        return <article className="investment-position" key={item.id}>
          <div className="investment-position-top"><div className="investment-position-name"><IconCoin ticker={item.ticker} size={34} /><span><strong>{coin?.name || item.ticker} simulation</strong><small>Opened {shortDate(item.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</small></span></div><span className={`investment-status ${item.status === 'closed' ? 'investment-status-closed' : item.canRedeem ? 'investment-status-ready' : 'investment-status-locked'}`}>{status}</span></div>
          <div className="investment-position-stats"><div><span>Principal</span><strong>{Number(item.principal).toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.ticker}</strong></div><div><span>Simulated value</span><strong>{Number(item.currentValue).toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.ticker}</strong>{price !== undefined && <small>{money(Number(item.currentValue) * price, currency)} indicative</small>}</div><div><span>Simulated gain</span><strong>{Number(item.profitAmount) > 0 ? '+' : ''}{Number(item.profitAmount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {item.ticker}</strong><small>{item.completedPeriods} completed period{item.completedPeriods === 1 ? '' : 's'}</small></div></div>
          {item.status === 'active' && <div className="investment-position-footer">{item.canRedeem ? <button className="button button-secondary button-small" disabled={busy} onClick={() => onRedeem(item.id)}>Redeem simulation</button> : <span>Locked until {shortDate(item.maturesAt, { month: 'long', day: 'numeric', year: 'numeric' })}</span>}</div>}
        </article>
      })}</div>}
    </div>
  </section>
}

function Dashboard({ user, activities, investments, prices, currency, loadingPrices, onWalletAction, setPage }) {
  const balances = user.balances || {}
  const totalBalances = balancesWithActiveInvestments(balances, investments)
  const total = COINS.reduce((sum, coin) => sum + Number(totalBalances[coin.ticker] || 0) * (coinPrice(prices, coin.ticker, currency) || 0), 0)
  const hasPrices = COINS.some(coin => coinPrice(prices, coin.ticker, currency))
  const todayChange = COINS.reduce((sum, coin) => sum + Number(totalBalances[coin.ticker] || 0) * (coinPrice(prices, coin.ticker, currency) || 0) * (prices[coin.id]?.usd_24h_change || 0) / 100, 0)
  const totalChange = total ? (todayChange / total) * 100 : 0
  return <div className="page-content">
    <div className="welcome-row"><div><div className="eyebrow page-eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()}</div><h1>Good to see you, {user.name?.split(' ')[0] || 'there'} <span className="wave">✦</span></h1><p className="muted">Here’s what’s happening with your wallet today.</p></div><WalletActions onSend={() => onWalletAction('send')} onReceive={() => onWalletAction('receive')} onWithdraw={() => onWalletAction('withdraw')} /></div>
    <section className="balance-card">
      <div className="balance-copy"><span className="balance-label">TOTAL WALLET BALANCE <Eye size={15} /></span><div className="balance-amount">{hasPrices ? money(total, currency) : loadingPrices ? <span className="skeleton skeleton-balance" /> : '—'}</div><div className="balance-meta">{hasPrices ? <><span className={`balance-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>{totalChange >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}{Math.abs(totalChange).toFixed(2)}%</span><span>Estimated change · 24h</span></> : <span>{loadingPrices ? 'Loading live market prices…' : 'Live market prices unavailable'}</span>}</div><p className="balance-note">Estimated value based on current public market prices.</p></div>
      <div className="balance-chart-art" aria-hidden="true"><div className="chart-art-tag"><span>PORTFOLIO</span><strong>{hasPrices ? money(total, currency) : '—'}</strong></div><svg viewBox="0 0 460 185" preserveAspectRatio="none"><defs><linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d5e7ff" stopOpacity=".3" /><stop offset="100%" stopColor="#d5e7ff" stopOpacity="0" /></linearGradient></defs><path className="hero-area" d="M0 148 C35 140 43 113 76 125 S117 147 144 106 184 118 210 86 244 108 275 66 314 86 340 46 376 72 402 33 437 51 460 12 V185 H0 Z" /><path className="hero-line" d="M0 148 C35 140 43 113 76 125 S117 147 144 106 184 118 210 86 244 108 275 66 314 86 340 46 376 72 402 33 437 51 460 12" /><circle cx="460" cy="12" r="5" className="hero-dot" /></svg><div className="chart-art-foot"><span>Illustrative visualization</span><span><span className="status-dot" /> INDICATIVE</span></div></div>
    </section>
    <div className="section-heading"><div><h2>Your assets</h2><p>Holdings and current market prices</p></div><button className="text-button" onClick={() => setPage('portfolio')}>Open wallet <ChevronRight size={16} /></button></div>
    <AssetCards balances={balances} prices={prices} currency={currency} onSelect={() => setPage('portfolio')} />
    <div className="dashboard-lower">
      <section className="panel performance-panel"><div className="panel-heading"><div><h2>Portfolio history</h2><p>Estimated value · priced at current rates</p></div><span className="panel-tag"><Activity size={14} /> Overview</span></div><PortfolioChart activities={activities} prices={prices} currency={currency} /></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest account updates</p></div><button className="icon-button subtle-icon" onClick={() => setPage('activity')} aria-label="View all activity"><MoreHorizontal size={20} /></button></div><RecentActivity activities={activities.slice(0, 4)} /></section>
    </div>
    <div className="data-disclaimer"><CircleHelp size={15} /><span>Portfolio estimates use public market quotes and may differ from actual exchange prices. PrimeVest records account activity; it does not execute trades or transfers.</span></div>
  </div>
}

function RecentActivity({ activities }) {
  if (!activities.length) return <div className="recent-empty"><Clock3 size={20} /><span>No activity to show yet.</span></div>
  return <div className="recent-list">{activities.map(item => {
    const incoming = item.type === 'received' || item.type === 'bought'
    return <div className="recent-row" key={item.id}><IconCoin ticker={item.ticker} size={38} /><div className="recent-copy"><strong>{item.title || item.type}</strong><span>{shortDate(item.createdAt)} · {item.ticker}</span></div><span className={incoming ? 'amount-positive' : 'amount-neutral'}>{incoming ? '+' : '−'}{Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span></div>
  })}</div>
}

function DepositAddresses({ user }) {
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const addresses = user.depositAddress && user.depositAsset
    ? { ...(user.depositAddresses || {}), [user.depositAsset]: user.depositAddresses?.[user.depositAsset] || { address: user.depositAddress, network: user.network } }
    : user.depositAddresses || {}
  const available = COINS.filter(coin => addresses[coin.ticker]?.address)

  async function copyAddress(ticker, address) {
    setError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.')
      await navigator.clipboard.writeText(address)
      setCopied(ticker)
      window.setTimeout(() => setCopied(current => current === ticker ? '' : current), 1800)
    } catch (copyError) {
      setError(copyError.message)
    }
  }

  return <section className="panel deposit-panel">
    <div className="panel-heading"><div><h2>Deposit addresses</h2><p>Use the correct asset and network when funding your account.</p></div><span className="panel-tag"><Wallet size={14} />Account funding</span></div>
    {!available.length ? <div className="deposit-empty"><CircleHelp size={17} />No deposit addresses have been configured yet. Contact your account administrator.</div> : <div className="deposit-address-list">{available.map(coin => {
      const wallet = addresses[coin.ticker]
      return <div className="deposit-address-row" key={coin.ticker}><IconCoin ticker={coin.ticker} size={34} /><div className="deposit-address-copy"><strong>{coin.name} <span>{coin.ticker}</span></strong><small>{wallet.network || coin.name}</small><code title={wallet.address}>{wallet.address}</code></div><button className="button button-secondary button-small" onClick={() => copyAddress(coin.ticker, wallet.address)}>{copied === coin.ticker ? <Check size={14} /> : <Copy size={14} />}{copied === coin.ticker ? 'Copied' : 'Copy'}</button></div>
    })}</div>}
    {error && <div className="form-error deposit-error" role="alert">{error}</div>}
  </section>
}

function PortfolioPage({ user, investments, token, prices, currency, loadingPrices, onWalletAction, investmentBusy, investmentError, onInvest, onRedeem, onInvestmentsRefreshed }) {
  const totalBalances = balancesWithActiveInvestments(user.balances || {}, investments)
  const total = COINS.reduce((sum, item) => sum + Number(totalBalances[item.ticker] || 0) * (coinPrice(prices, item.ticker, currency) || 0), 0)
  return <div className="page-content">
    <div className="page-title-row wallet-page-heading"><div><div className="eyebrow page-eyebrow">YOUR WALLET</div><h1>Wallet</h1><p className="muted">Manage balances, receive addresses, and outgoing activity.</p></div><WalletActions onSend={() => onWalletAction('send')} onReceive={() => onWalletAction('receive')} onWithdraw={() => onWalletAction('withdraw')} /></div>
    <section className="wallet-total-panel"><div><span className="balance-label">ESTIMATED TOTAL BALANCE</span><strong>{COINS.some(item => coinPrice(prices, item.ticker, currency)) ? money(total, currency) : '—'}</strong><small>Includes active simulated positions; based on current public market prices</small></div><div className="wallet-total-icon"><Wallet size={23} /></div></section>
    <AssetCards balances={user.balances || {}} prices={prices} currency={currency} />
    <MarketTracker balances={user.balances || {}} prices={prices} currency={currency} loading={loadingPrices} />
    <InvestmentManager user={user} investments={investments} token={token} prices={prices} currency={currency} busy={investmentBusy} error={investmentError} onInvest={onInvest} onRedeem={onRedeem} onInvestmentsRefreshed={onInvestmentsRefreshed} />
  </div>
}

function AlertsPage({ alerts }) {
  return <div className="page-content">
    <div className="page-title-row"><div><div className="eyebrow page-eyebrow">ACCOUNT UPDATES</div><h1>Alerts</h1><p className="muted">Important messages about your PrimeVest account.</p></div></div>
    <section className="panel alerts-panel"><div className="panel-heading"><div><h2>Your notifications</h2><p>{alerts.length ? `${alerts.length} message${alerts.length === 1 ? '' : 's'}` : 'Messages from your account team'}</p></div><span className="alert-count"><Bell size={15} />{alerts.filter(item => !item.read).length} unread</span></div>
      {!alerts.length ? <div className="empty-state alerts-empty"><div className="empty-state-icon"><Bell size={21} /></div><strong>You’re all caught up</strong><span>When there’s an account update, you’ll find it here.</span></div> : <div className="alerts-list">{alerts.map(alert => <article className={`alert-card ${alert.read ? '' : 'alert-unread'}`} key={alert.id}><div className="alert-icon"><Bell size={17} /></div><div className="alert-copy"><div className="alert-title-row"><h3>{alert.title}</h3>{!alert.read && <span className="unread-dot" />}</div><p>{alert.message}</p><span>{shortDate(alert.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}</span></div></article>)}</div>}
    </section>
  </div>
}

function AccountModal({ user, token, onClose, onSaved }) {
  const [currency, setCurrency] = useState(user.currency || 'USD')
  const [wallet, setWallet] = useState(user.connectedWalletAddress || '')
  const [network, setNetwork] = useState(user.connectedWalletNetwork || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { user: updated } = await api('/api/auth/me', { token, method: 'PATCH', body: jsonBody({ currency, connectedWalletAddress: wallet.trim(), connectedWalletNetwork: network.trim() }) })
      onSaved(updated)
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally { setBusy(false) }
  }
  return <Modal title="Account settings" description="Manage your portfolio preferences." onClose={onClose}>
    <form className="modal-form" onSubmit={save}>
      <div className="profile-summary"><div className="avatar avatar-large">{(user.name || 'U').slice(0, 1).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><span className="role-pill">{user.role}</span></div>
      <label>Display currency<select value={currency} onChange={event => setCurrency(event.target.value)}>{CURRENCIES.map(code => <option key={code}>{code}</option>)}</select></label>
      <label>Connected wallet address <span className="label-optional">OPTIONAL</span><input value={wallet} onChange={event => setWallet(event.target.value)} maxLength={500} placeholder="Wallet address" /></label>
      <label>Wallet network <span className="label-optional">OPTIONAL</span><input value={network} onChange={event => setNetwork(event.target.value)} maxLength={100} placeholder="Network name" /></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy && <LoaderCircle size={16} className="spin" />}Save preferences</button></div>
    </form>
  </Modal>
}

function AdminPage({ token, onUserUpdated }) {
  const [users, setUsers] = useState([])
  const [activities, setActivities] = useState([])
  const [depositAddresses, setDepositAddresses] = useState({})
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [userData, activityData, addressData, alertData] = await Promise.all([
        api('/api/admin/users', { token }), api('/api/admin/activity', { token }),
        api('/api/admin/deposit-addresses', { token }), api('/api/admin/alerts', { token }),
      ])
      setUsers(userData.users)
      setActivities(activityData.activities)
      setDepositAddresses(addressData.depositAddresses || {})
      setAlerts(alertData.alerts)
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  async function updateUser(id, changes) {
    setBusy(true)
    setNotice('')
    try {
      const { user } = await api(`/api/admin/users/${encodeURIComponent(id)}`, { token, method: 'PATCH', body: jsonBody(changes) })
      setUsers(current => current.map(item => item.id === id ? user : item))
      setNotice('Account updated.')
      onUserUpdated(user)
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function saveAddresses(event) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    try {
      const result = await api('/api/admin/deposit-addresses', { token, method: 'PATCH', body: jsonBody({ depositAddresses }) })
      setDepositAddresses(result.depositAddresses)
      setNotice('Shared funding addresses saved.')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function submitDialog(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (dialog.kind === 'credit') {
        await api(`/api/admin/users/${encodeURIComponent(dialog.user.id)}/credit`, { token, method: 'POST', body: jsonBody({ ticker: dialog.ticker, amount: Number(dialog.amount) }) })
        setNotice(`Account credited with ${dialog.amount} ${dialog.ticker}.`)
      } else if (dialog.kind === 'fee') {
        await api(`/api/admin/users/${encodeURIComponent(dialog.user.id)}`, { token, method: 'PATCH', body: jsonBody({
          fee: Number(dialog.fee),
          feeTitle: dialog.feeTitle.trim(),
          feeDescription: dialog.feeDescription.trim(),
          feeStatus: dialog.feeStatus,
        }) })
        setNotice(`Withdrawal fee updated for ${dialog.user.name}.`)
      } else if (dialog.kind === 'broadcast') {
        const result = await api('/api/admin/alerts', { token, method: 'POST', body: jsonBody({ title: dialog.title, message: dialog.message }) })
        setNotice(`Alert sent to ${result.sent} customer account${result.sent === 1 ? '' : 's'}.`)
      } else {
        await api(`/api/admin/users/${encodeURIComponent(dialog.user.id)}/alerts`, { token, method: 'POST', body: jsonBody({ title: dialog.title, message: dialog.message }) })
        setNotice(`Alert sent to ${dialog.user.name}.`)
      }
      setDialog(null)
      await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  const totals = users.length
  const filteredUsers = users.filter(user => {
    const query = userQuery.trim().toLowerCase()
    const matchesQuery = !query || `${user.name} ${user.email}`.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || (user.status || 'approved') === statusFilter
    return matchesQuery && matchesStatus
  })
  if (loading) return <div className="page-content"><div className="loading-panel"><LoaderCircle className="spin" size={22} />Loading administrator workspace…</div></div>
  return <div className="page-content admin-page">
    <div className="page-title-row"><div><div className="eyebrow page-eyebrow">BLUEVAULT OPERATIONS</div><h1>Admin dashboard</h1><p className="muted">Manage accounts, activity, and shared funding details.</p></div><div className="admin-page-actions"><button className="button button-primary" onClick={() => setDialog({ kind: 'broadcast', title: '', message: '' })}><Bell size={16} />Send alert to all</button><button className="button button-secondary" onClick={load}><Activity size={16} />Refresh data</button></div></div>
    {error && <div className="form-error admin-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
    {notice && <div className="success-banner"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}
    <div className="admin-stats"><div className="panel admin-stat"><span>ACCOUNTS</span><strong>{totals}</strong><small>Registered users</small></div><div className="panel admin-stat"><span>ACCOUNT ACTIVITY</span><strong>{activities.length}</strong><small>Recorded events</small></div><div className="panel admin-stat"><span>SENT ALERTS</span><strong>{alerts.length}</strong><small>Account messages</small></div><div className="panel admin-stat"><span>APPROVED</span><strong>{users.filter(user => user.status === 'approved' || !user.status).length}</strong><small>Active accounts</small></div></div>
    <section className="panel admin-users-panel"><div className="panel-heading admin-users-heading"><div><h2>Customer accounts</h2><p>Review and manage account access.</p></div><div className="admin-user-tools"><label className="admin-search"><Search size={15} /><input aria-label="Search customers" value={userQuery} onChange={event => setUserQuery(event.target.value)} placeholder="Search name or email" /></label><select aria-label="Filter customers by status" className="admin-filter-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="banned">Banned</option></select><span className="admin-record-count">{filteredUsers.length} of {users.length}</span></div></div>
      {!users.length ? <div className="empty-state"><Users size={23} /><strong>No customer accounts yet</strong><span>New registrations will appear here.</span></div> : !filteredUsers.length ? <div className="empty-state"><Search size={23} /><strong>No matching accounts</strong><span>Try a different name, email, or access status.</span></div> : <div className="table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Joined</th><th>Balances</th><th>Access</th><th>Manage</th></tr></thead><tbody>{filteredUsers.map(user => <tr key={user.id}><td><div className="admin-person"><div className="avatar">{(user.name || 'U').slice(0, 1).toUpperCase()}</div><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{shortDate(user.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>{Object.entries(user.balances || {}).filter(([, value]) => Number(value)).map(([ticker, value]) => <span className="balance-mini" key={ticker}>{Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} {ticker}</span>)}{!Object.values(user.balances || {}).some(Number) && <span className="muted">No holdings</span>}</td><td><select className="status-select" value={user.status || 'approved'} onChange={event => updateUser(user.id, { status: event.target.value })} disabled={busy}><option value="approved">Approved</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="banned">Banned</option></select></td><td><div className="admin-actions"><button className="button button-small button-secondary" onClick={() => setDialog({ kind: 'credit', user, ticker: 'USDT', amount: '' })}>Credit</button><button className="button button-small button-secondary" onClick={() => setDialog({ kind: 'fee', user, fee: String(user.fee || 0), feeTitle: user.feeTitle || 'Withdrawal fee', feeDescription: user.feeDescription || '', feeStatus: ['active', 'paid'].includes(user.feeStatus) ? user.feeStatus : 'inactive' })}>Fee</button><button className="icon-button admin-icon-button" onClick={() => setDialog({ kind: 'alert', user, title: '', message: '' })} aria-label={`Send alert to ${user.name}`}><Bell size={16} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    <section className="panel funding-panel"><div className="panel-heading"><div><h2>Shared funding addresses</h2><p>These addresses are displayed to every customer for the selected asset.</p></div><span className="panel-tag"><ShieldCheck size={14} /> Admin managed</span></div>
      <form className="address-grid" onSubmit={saveAddresses}>{COINS.map(coin => <div className="address-field" key={coin.ticker}><label><span className="address-label"><IconCoin ticker={coin.ticker} size={26} /><strong>{coin.name}</strong><small>{coin.ticker}</small></span><input value={depositAddresses[coin.ticker]?.address || ''} onChange={event => setDepositAddresses(current => ({ ...current, [coin.ticker]: { address: event.target.value, network: depositAddresses[coin.ticker]?.network || ({ BTC: 'Bitcoin', ETH: 'Ethereum (ERC-20)', USDT: 'TRON (TRC-20)', SOL: 'Solana' })[coin.ticker] } }))} placeholder={`${coin.name} deposit address`} maxLength={500} /></label>{coin.ticker === 'USDT' && <label>Network<select value={depositAddresses.USDT?.network || 'TRON (TRC-20)'} onChange={event => setDepositAddresses(current => ({ ...current, USDT: { address: current.USDT?.address || '', network: event.target.value } }))}><option>TRON (TRC-20)</option><option>Ethereum (ERC-20)</option><option>BNB Smart Chain (BEP-20)</option></select></label>}</div>)}
      <div className="address-save-row"><div className="notice-box"><CircleHelp size={16} /><span>Only enter addresses controlled by your organization. Double-check every network.</span></div><button className="button button-primary" disabled={busy}>{busy && <LoaderCircle size={16} className="spin" />}Save addresses</button></div></form>
    </section>
    <section className="panel admin-activity-panel"><div className="panel-heading"><div><h2>Latest account activity</h2><p>Recent recorded activity across customer accounts.</p></div></div>{activities.length ? <div className="table-scroll"><table className="activity-table"><thead><tr><th>Customer</th><th>Activity</th><th>Date</th><th>Status</th></tr></thead><tbody>{activities.slice(0, 8).map(item => <tr key={item.id}><td><span className="admin-activity-customer"><strong>{item.userName}</strong><small>{item.userEmail}</small></span></td><td>{item.title} · {Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {item.ticker}</td><td>{shortDate(item.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className="status-pill status-completed"><span />{item.status || 'Completed'}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><FileClock size={22} /><strong>No activity yet</strong></div>}</section>
    {dialog && <Modal title={dialog.kind === 'credit' ? `Credit ${dialog.user.name}` : dialog.kind === 'fee' ? `Withdrawal fee · ${dialog.user.name}` : dialog.kind === 'broadcast' ? 'Send alert to all customers' : `Send alert to ${dialog.user.name}`} description={dialog.kind === 'credit' ? 'Credit this customer account and record the activity.' : dialog.kind === 'fee' ? 'Set the flat USD fee shown during account withdrawals.' : dialog.kind === 'broadcast' ? `This message will be delivered to ${users.length} customer account${users.length === 1 ? '' : 's'}.` : 'This message will appear in the customer’s alerts.'} onClose={() => setDialog(null)}>
      <form className="modal-form" onSubmit={submitDialog}>{dialog.kind === 'credit' ? <><label>Asset<select value={dialog.ticker} onChange={event => setDialog({ ...dialog, ticker: event.target.value })}>{COINS.map(coin => <option key={coin.ticker}>{coin.ticker}</option>)}</select></label><label>Amount<input type="number" min="0.00000001" step="any" required value={dialog.amount} onChange={event => setDialog({ ...dialog, amount: event.target.value })} /></label><div className="notice-box"><CircleHelp size={17} /><span>Credits are immediately added to the customer’s account balance.</span></div></> : dialog.kind === 'fee' ? <><label>Fee amount (USD)<input type="number" min="0" step="0.01" required value={dialog.fee} onChange={event => setDialog({ ...dialog, fee: event.target.value })} /></label><label>Fee title<input maxLength={120} required value={dialog.feeTitle} onChange={event => setDialog({ ...dialog, feeTitle: event.target.value })} /></label><label>Customer message<textarea rows={3} maxLength={1000} value={dialog.feeDescription} onChange={event => setDialog({ ...dialog, feeDescription: event.target.value })} placeholder="Optional explanation shown with the fee" /></label><label>Fee status<select value={dialog.feeStatus} onChange={event => setDialog({ ...dialog, feeStatus: event.target.value })}><option value="inactive">No fee required</option><option value="active">Require USDT fee payment</option><option value="paid">Payment verified — unlock withdrawal</option></select></label><div className="notice-box"><CircleHelp size={17} /><span>Set “Require USDT fee payment” to lock withdrawals. After you verify the transfer outside the app, mark it paid to unlock the withdrawal fields.</span></div></> : <><label>Title<input maxLength={120} required value={dialog.title} onChange={event => setDialog({ ...dialog, title: event.target.value })} /></label><label>Message<textarea rows={4} maxLength={1000} required value={dialog.message} onChange={event => setDialog({ ...dialog, message: event.target.value })} /></label>{dialog.kind === 'broadcast' && <div className="notice-box"><Bell size={17} /><span>This alert will be sent to all customer accounts. Administrator accounts are excluded.</span></div>}</>}
        {error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Cancel</button><button className="button button-primary" disabled={busy || (dialog.kind === 'broadcast' && users.length === 0)}>{busy && <LoaderCircle size={16} className="spin" />}{dialog.kind === 'credit' ? 'Credit account' : dialog.kind === 'fee' ? 'Save fee' : dialog.kind === 'broadcast' ? 'Send to all' : 'Send alert'}</button></div></form>
    </Modal>}
  </div>
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(null)
  const [activities, setActivities] = useState([])
  const [investments, setInvestments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [page, setPage] = useState('portfolio')
  const [prices, setPrices] = useState({})
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [sessionLoading, setSessionLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))
  const [sessionError, setSessionError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [modal, setModal] = useState('')
  const [activityBusy, setActivityBusy] = useState(false)
  const [activityError, setActivityError] = useState('')
  const [investmentBusy, setInvestmentBusy] = useState(false)
  const [investmentError, setInvestmentError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const loadAccount = useCallback(async activeToken => {
    const [accountData, activityData, alertData, investmentData] = await Promise.all([
      api('/api/auth/me', { token: activeToken }),
      api('/api/activity', { token: activeToken }),
      api('/api/alerts', { token: activeToken }),
      api('/api/investments', { token: activeToken }),
    ])
    setUser(accountData.user)
    setActivities(activityData.activities)
    setAlerts(alertData.alerts)
    setInvestments(investmentData.investments)
  }, [])

  useEffect(() => {
    if (!token) { setSessionLoading(false); return }
    setSessionLoading(true)
    loadAccount(token).catch(error => {
      localStorage.removeItem(TOKEN_KEY)
      setToken('')
      setUser(null)
      setSessionError(error.message)
    }).finally(() => setSessionLoading(false))
  }, [token, loadAccount])

  useEffect(() => {
    const controller = new AbortController()
    async function loadPrices() {
      try {
        const response = await fetch(PRICE_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`Market data request failed (${response.status}).`)
        setPrices(await response.json())
      } catch (error) {
        if (error.name !== 'AbortError') setPrices({})
      } finally { if (!controller.signal.aborted) setLoadingPrices(false) }
    }
    loadPrices()
    const timer = window.setInterval(loadPrices, 60000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function signIn(result) {
    localStorage.setItem(TOKEN_KEY, result.token)
    setToken(result.token)
    setUser(result.user)
    setSessionError('')
    setToast(`Welcome${result.user.name ? `, ${result.user.name.split(' ')[0]}` : ''}.`)
  }

  async function signOut() {
    const activeToken = token
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
    setActivities([])
    setInvestments([])
    setAlerts([])
    try { await api('/api/auth/logout', { token: activeToken, method: 'POST' }) }
    catch (error) { setSessionError(`Signed out on this device, but server revocation failed: ${error.message}`) }
  }

  async function recordActivity(payload) {
    setActivityBusy(true)
    setActivityError('')
    try {
      await api('/api/activity', { token, method: 'POST', body: jsonBody(payload) })
      await loadAccount(token)
      setModal('')
      setToast('Activity saved to your account.')
    } catch (error) { setActivityError(error.message) }
    finally { setActivityBusy(false) }
  }

  async function placeInvestment(payload) {
    setInvestmentBusy(true)
    setInvestmentError('')
    try {
      const result = await api('/api/investments', { token, method: 'POST', body: jsonBody(payload) })
      setUser(result.user)
      setInvestments(current => [result.investment, ...current])
    } catch (error) {
      setInvestmentError(error.message)
      setInvestmentBusy(false)
      return false
    }
    try {
      await loadAccount(token)
      setToast('Simulated investment created and locked for 30 days.')
    } catch (error) {
      setInvestmentError(`Investment was recorded, but the account refresh failed: ${error.message}`)
      setToast('Investment recorded. Refresh the wallet to update your balances.')
    } finally { setInvestmentBusy(false) }
    return true
  }

  async function redeemInvestment(id) {
    setInvestmentBusy(true)
    setInvestmentError('')
    try {
      const result = await api(`/api/investments/${encodeURIComponent(id)}/redeem`, { token, method: 'POST' })
      setUser(result.user)
      setInvestments(current => current.map(item => item.id === id ? result.investment : item))
    } catch (error) {
      setInvestmentError(error.message)
      setInvestmentBusy(false)
      return
    }
    try {
      await loadAccount(token)
      setToast('Simulated investment redeemed to your wallet.')
    } catch (error) {
      setInvestmentError(`Investment was redeemed, but the account refresh failed: ${error.message}`)
      setToast('Investment redeemed. Refresh the wallet to update your balances.')
    } finally { setInvestmentBusy(false) }
  }

  function pageTitle() {
    return ({ overview: 'Home', portfolio: 'Wallet', activity: 'Activity', alerts: 'Alerts', admin: 'Admin dashboard' })[page] || 'Home'
  }

  function openWalletAction(action) {
    setActivityError('')
    setModal(action === 'receive' ? 'receive' : `wallet-${action}`)
  }

  if (sessionLoading) return <main className="full-loading"><Brand /><div><LoaderCircle className="spin" size={22} />Restoring your secure session…</div></main>
  if (!user || !token) return <><AuthScreen onLogin={signIn} />{sessionError && <div className="auth-session-error" role="alert">{sessionError}</div>}</>

  const currency = user.currency || 'USD'
  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} user={user} open={mobileNav} onClose={() => setMobileNav(false)} onLogout={signOut} />
    <div className="main-shell"><Topbar user={user} pageTitle={pageTitle()} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onLogout={signOut} onMenu={() => setMobileNav(true)} onProfile={() => setModal('account')} />
      <main>
        <div className="mobile-page-title"><span>{pageTitle()}</span>{page === 'alerts' && alerts.some(alert => !alert.read) && <span className="unread-dot" />}</div>
        {page === 'overview' && <Dashboard user={user} activities={activities} investments={investments} prices={prices} currency={currency} loadingPrices={loadingPrices} onWalletAction={openWalletAction} setPage={setPage} />}
        {page === 'portfolio' && <PortfolioPage user={user} investments={investments} token={token} prices={prices} currency={currency} onWalletAction={openWalletAction} loadingPrices={loadingPrices} investmentBusy={investmentBusy} investmentError={investmentError} onInvest={placeInvestment} onRedeem={redeemInvestment} onInvestmentsRefreshed={setInvestments} />}
        {page === 'activity' && <div className="page-content"><div className="page-title-row"><div><div className="eyebrow page-eyebrow">YOUR ACCOUNT</div><h1>Activity</h1><p className="muted">A record of activity associated with your account.</p></div><button className="button button-primary" onClick={() => { setActivityError(''); setModal('activity') }}><Plus size={17} />Record activity</button></div><section className="panel full-activity-panel"><div className="panel-heading"><div><h2>All activity</h2><p>{activities.length} record{activities.length === 1 ? '' : 's'}</p></div><span className="panel-tag"><FileClock size={14} />Account history</span></div><ActivityTable activities={activities} currency={currency} prices={prices} /></section></div>}
        {page === 'alerts' && <AlertsPage alerts={alerts} />}
        {page === 'admin' && user.role === 'admin' && <AdminPage token={token} onUserUpdated={updated => { if (updated.id === user.id) setUser(updated) }} />}
        <footer className="app-footer"><span>© {new Date().getFullYear()} PrimeVest. All rights reserved.</span><span><ShieldCheck size={14} />Your account is encrypted and private.</span></footer>
      </main>
    </div>
    <MobileNav page={page} setPage={setPage} />
    {modal === 'activity' && <ActivityModal onClose={() => setModal('')} onSubmit={recordActivity} busy={activityBusy} error={activityError} balances={user.balances || {}} />}
    {modal === 'receive' && <ReceiveModal user={user} token={token} onClose={() => setModal('')} onUserUpdated={setUser} />}
    {(modal === 'wallet-send' || modal === 'wallet-withdraw') && <OutgoingModal action={modal.slice('wallet-'.length)} user={user} token={token} prices={prices} onClose={() => setModal('')} onSubmit={payload => recordActivity({ ...payload, type: 'sent' })} onUserUpdated={setUser} busy={activityBusy} error={activityError} />}
    {modal === 'account' && <AccountModal user={user} token={token} onClose={() => setModal('')} onSaved={setUser} />}
    {toast && <div className="toast"><span><Check size={15} /></span>{toast}</div>}
  </div>
}
