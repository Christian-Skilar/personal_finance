import { formatMonthShort, type YearMonth } from '../../domain/month'
import { kr } from '../format'

export interface ChartPoint {
  month: YearMonth
  planned: number
  actual: number
}

const W = 320
const H = 150
const LEFT = 8
const TOP = 12
const BOTTOM = 122

export function PlanChart({ points }: { points: ChartPoint[] }) {
  const values = points.flatMap((p) => [p.planned, p.actual])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const x = (i: number) => LEFT + (points.length === 1 ? (W - LEFT) / 2 : (i * (W - LEFT * 2)) / (points.length - 1))
  const y = (v: number) => TOP + ((max - v) / span) * (BOTTOM - TOP)
  const last = points[points.length - 1]
  const diff = last.planned - last.actual
  const label = `Restgjeld ${formatMonthShort(points[0].month)} til ${formatMonthShort(last.month)}. Siste måned er faktisk restgjeld ${kr(
    Math.abs(diff),
  )} ${diff >= 0 ? 'lavere' : 'høyere'} enn planen.`

  return (
    <figure style={{ margin: 0 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <g stroke="var(--line-soft)">
          <path d={`M0 ${TOP}H${W}M0 ${(TOP + BOTTOM) / 2}H${W}M0 ${BOTTOM}H${W}`} />
        </g>
        <polyline points={points.map((p, i) => `${x(i)},${y(p.planned)}`).join(' ')} fill="none" stroke="#8fa39a" strokeWidth={2} strokeDasharray="5 4" />
        <polyline points={points.map((p, i) => `${x(i)},${y(p.actual)}`).join(' ')} fill="none" stroke="var(--primary)" strokeWidth={2.5} />
        {points.map((p, i) => (
          <circle key={p.month} cx={x(i)} cy={y(p.actual)} r={3.5} fill="var(--primary)" />
        ))}
        <g fontSize={11} fill="var(--muted)">
          {points.map((p, i) => (
            <text key={p.month} x={x(i)} y={H - 6} textAnchor="middle">
              {formatMonthShort(p.month).split(' ')[0]}
            </text>
          ))}
        </g>
      </svg>
      <figcaption style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, borderTop: '2px dashed #8fa39a' }} />
          Plan
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 3, background: 'var(--primary)', borderRadius: 2 }} />
          Faktisk (registrert)
        </span>
      </figcaption>
    </figure>
  )
}
