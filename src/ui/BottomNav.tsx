import { NavLink } from 'react-router-dom'
import { FlagIcon, HomeIcon, ListIcon, PencilIcon } from './icons'

const items = [
  { to: '/', label: 'Oversikt', icon: <HomeIcon />, end: true },
  { to: '/lan', label: 'Lån', icon: <ListIcon />, end: false },
  { to: '/oppdater', label: 'Oppdater', icon: <PencilIcon />, end: false },
  { to: '/planer', label: 'Planer', icon: <FlagIcon />, end: false },
]

export function BottomNav() {
  return (
    <nav className="nav" aria-label="Hovedmeny">
      <div className="nav-inner">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end}>
            {it.icon}
            <span>{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
