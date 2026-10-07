import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import Icon from './Icon.jsx'

// Replace with your real merchant VPA / gateway ids when a backend exists.
export const MERCHANT = { name: 'EduMen', vpa: 'EduMen@upi' }
const inr = (n) => '₹' + n.toLocaleString('en-IN')
const AMTS = [500, 1000, 2000, 5000]
const ua = navigator.userAgent
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isAndroid = /Android/i.test(ua)
const isMobile = isIOS || isAndroid
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const GPAY = { supportedMethods: 'https://google.com/pay', data: { environment: 'TEST', apiVersion: 2, apiVersionMinor: 0, merchantInfo: { merchantName: MERCHANT.name },
  allowedPaymentMethods: [{ type: 'CARD', parameters: { allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'], allowedCardNetworks: ['VISA', 'MASTERCARD'] },
    tokenizationSpecification: { type: 'PAYMENT_GATEWAY', parameters: { gateway: 'example', gatewayMerchantId: 'exampleGatewayMerchantId' } } }] } }
const payReq = (amt) => new PaymentRequest([GPAY], { total: { label: 'EduMen credits', amount: { currency: 'INR', value: String(amt) } } })
const upiQuery = (amt, tr) => `pa=${MERCHANT.vpa}&pn=${encodeURIComponent(MERCHANT.name)}&am=${amt}&cu=INR&tn=${encodeURIComponent('EduMen credits')}&tr=${tr}`
const luhn = (s) => { let t = 0, d = false; for (let i = s.length - 1; i >= 0; i--) { let n = +s[i]; if (d && (n *= 2) > 9) n -= 9; t += n; d = !d } return t % 10 === 0 }

const Badge = ({ bg, fg = '#fff', children }) => <span className="pb" style={{ background: bg, color: fg }}>{children}</span>

export default function TopUp({ onAdd, onClose }) {
  const [amt, setAmt] = useState(1000)
  const [custom, setCustom] = useState('')
  const [step, setStep] = useState('amount') // amount | methods | upi | card | wait | busy | ok
  const [gp, setGp] = useState(false)
  const [apple, setApple] = useState(false)
  const [upi, setUpi] = useState('')
  const [card, setCard] = useState({ n: '', e: '', c: '' })
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(null)
  const [txn, setTxn] = useState('')
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  useEffect(() => {
    try { setApple(!!(window.ApplePaySession && window.ApplePaySession.canMakePayments())) } catch (e) {}
    if (window.PaymentRequest) payReq(10).canMakePayment().then((ok) => alive.current && setGp(!!ok)).catch(() => {})
  }, [])

  const pay = amt
  const amountOk = pay >= 100 && pay <= 50000
  const setCustomAmt = (v) => { const d = v.replace(/\D/g, '').slice(0, 5); setCustom(d); if (d) setAmt(+d) }
  const success = (label) => {
    if (!alive.current) return
    const id = 'CH' + Date.now().toString(36).toUpperCase()
    setTxn(id); setStep('ok'); onAdd(pay, label, id)
  }
  // Showcase processing: stands in for a gateway round-trip
  const simulate = async (label) => { setStep('busy'); await wait(1600); success(label) }

  const doGooglePay = async () => {
    if (gp) {
      try { setStep('busy'); const r = await payReq(pay).show(); await r.complete('success'); success('Google Pay') }
      catch (e) { if (alive.current) { setStep('methods'); if (e.name !== 'AbortError') setErr('Google Pay could not complete. Try another method.') } }
    } else openUpi('Google Pay', (isIOS ? 'gpay://upi/pay?' : 'tez://upi/pay?'))
  }
  const openUpi = (label, base) => {
    setPending(label); setStep('wait')
    window.location.href = base + upiQuery(pay, 'CH' + Date.now())
  }
  const submitUpi = () => {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) return setErr('Enter a valid UPI ID, e.g. name@okaxis')
    setErr(''); simulate('UPI · ' + upi.trim())
  }
  const submitCard = () => {
    const n = card.n.replace(/\s/g, ''), [mm, yy] = card.e.split('/')
    if (n.length < 13 || !luhn(n)) return setErr('Check your card number.')
    if (!(+mm >= 1 && +mm <= 12) || !yy || yy.length !== 2) return setErr('Enter expiry as MM/YY.')
    if (card.c.length < 3) return setErr('Enter the CVV.')
    setErr(''); simulate('Card •••• ' + n.slice(-4))
  }

  const methods = [
    apple && { k: 'ap', name: 'Apple Pay', sub: 'Pay with Face ID / Touch ID', b: <Badge bg="#000">Pay</Badge>, go: () => simulate('Apple Pay') },
    (gp || isMobile) && { k: 'gp', name: 'Google Pay', sub: gp ? 'Fast and secure' : 'Opens the Google Pay app', b: <Badge bg="#fff" fg="#4285F4">G</Badge>, go: doGooglePay },
    isMobile && { k: 'pp', name: 'PhonePe', sub: 'UPI', b: <Badge bg="#5F259F">Pe</Badge>, go: () => openUpi('PhonePe', 'phonepe://pay?') },
    isMobile && { k: 'pt', name: 'Paytm', sub: 'UPI', b: <Badge bg="#00BAF2">Pt</Badge>, go: () => openUpi('UPI app', 'paytmmp://pay?') },
    isMobile && { k: 'up', name: 'Other UPI apps', sub: 'BHIM, CRED, bank apps…', b: <Badge bg="#E8590C">UPI</Badge>, go: () => openUpi('UPI app', 'upi://pay?') },
    { k: 'id', name: 'UPI ID', sub: 'Pay with your VPA', b: <Badge bg="#0F766E">@</Badge>, go: () => { setErr(''); setStep('upi') } },
    { k: 'cd', name: 'Debit / Credit card', sub: 'Visa, Mastercard, RuPay', b: <Badge bg="#334155"><Icon n="card" size={16} /></Badge>, go: () => { setErr(''); setStep('card') } },
  ].filter(Boolean)

  const back = step === 'methods' ? () => setStep('amount') : ['upi', 'card', 'wait'].includes(step) ? () => { setErr(''); setStep('methods') } : null
  const title = step === 'ok' ? 'Payment successful' : 'Top up credits'

  return (
    <Sheet title={title} onClose={onClose}>
      {back && <button className="link" style={{ marginTop: -6 }} onClick={back}>← Back</button>}

      {step === 'amount' && <>
        <p className="muted ctr" style={{ margin: '4px 0 0' }}>Credits are used to pay for sessions.</p>
        <div className="chips" role="group" aria-label="Amount">
          {AMTS.map((a) => <button key={a} className="chip" aria-pressed={amt === a && !custom} onClick={() => { setAmt(a); setCustom('') }}>{inr(a)}</button>)}
        </div>
        <div className="amt-in"><span>₹</span><input inputMode="numeric" placeholder="Other amount (100 – 50,000)" value={custom} onChange={(e) => setCustomAmt(e.target.value)} aria-label="Custom amount" /></div>
        <button className="btn block" style={{ marginTop: 18 }} disabled={!amountOk} onClick={() => setStep('methods')}>{amountOk ? `Continue · ${inr(pay)}` : 'Enter 100 – 50,000'}</button>
      </>}

      {step === 'methods' && <>
        <div className="pay-amt">Paying <b>{inr(pay)}</b></div>
        <div className="pay-list">
          {methods.map((m) => (
            <button key={m.k} className="pay-opt" onClick={m.go}>{m.b}<span className="grow"><b>{m.name}</b><span className="muted sm">{m.sub}</span></span><Icon n="chev" size={18} /></button>
          ))}
        </div>
        {err && <div className="err ctr">{err}</div>}
        <p className="fine"><Icon n="shield" size={13} /> Demo mode: no real money is charged.</p>
      </>}

      {step === 'upi' && <>
        <div className="pay-amt">Paying <b>{inr(pay)}</b></div>
        <div className="inp"><input value={upi} onChange={(e) => { setUpi(e.target.value); setErr('') }} placeholder="yourname@bank" autoCapitalize="none" autoCorrect="off" inputMode="email" aria-label="UPI ID" aria-invalid={!!err} /></div>
        {err && <div className="err">{err}</div>}
        <button className="btn block" style={{ marginTop: 16 }} onClick={submitUpi}>Verify & pay {inr(pay)}</button>
      </>}

      {step === 'card' && <>
        <div className="pay-amt">Paying <b>{inr(pay)}</b></div>
        <div className="inp"><input value={card.n} inputMode="numeric" autoComplete="cc-number" placeholder="Card number" aria-label="Card number" onChange={(e) => setCard({ ...card, n: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })} /></div>
        <div className="two">
          <div className="inp"><input value={card.e} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-label="Expiry" onChange={(e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); setCard({ ...card, e: v }) }} /></div>
          <div className="inp"><input value={card.c} type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="CVV" aria-label="CVV" onChange={(e) => setCard({ ...card, c: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></div>
        </div>
        {err && <div className="err">{err}</div>}
        <button className="btn block" style={{ marginTop: 16 }} onClick={submitCard}>Pay {inr(pay)}</button>
        <p className="fine">Showcase form: card details are validated on your device and never sent anywhere.</p>
      </>}

      {step === 'wait' && <div className="pay-state">
        <span className="spin" />
        <h3>Complete the payment in {pending}</h3>
        <p className="muted">Approve {inr(pay)} there, then come back here. If the app did not open, go back and pick another method.</p>
        <button className="btn block" onClick={() => success(pending)}>I've completed the payment</button>
        <button className="link" onClick={() => setStep('methods')}>Cancel</button>
      </div>}

      {step === 'busy' && <div className="pay-state"><span className="spin" /><h3>Processing {inr(pay)}…</h3><p className="muted">Please don't close this screen.</p></div>}

      {step === 'ok' && <div className="pay-state">
        <span className="ok-ring">✓</span>
        <h3>{inr(pay)} added to your credits</h3>
        <p className="muted sm">Transaction {txn}</p>
        <button className="btn block" onClick={onClose}>Done</button>
      </div>}
    </Sheet>
  )
}
