export default function Toast({ msg }) {
  return <div className={'toast' + (msg ? ' show' : '')} role="status" aria-live="polite">{msg}</div>
}
