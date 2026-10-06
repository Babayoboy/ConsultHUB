import { DAYS, TIMES } from '../data.js'
export default function SlotPicker({ value, onChange }) {
  return (
    <>
      <div className="lbl">Day</div>
      <div className="chips" role="group" aria-label="Pick a day">
        {DAYS.map((d) => <button key={d} className="chip" aria-pressed={value.day === d} onClick={() => onChange({ ...value, day: d })}>{d}</button>)}
      </div>
      <div className="lbl">Time</div>
      <div className="chips" role="group" aria-label="Pick a time">
        {TIMES.map((t) => <button key={t} className="chip" aria-pressed={value.time === t} onClick={() => onChange({ ...value, time: t })}>{t}</button>)}
      </div>
    </>
  )
}
