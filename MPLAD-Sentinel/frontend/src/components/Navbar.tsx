import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';

const NAV_LINKS = [
  { to: '/',         label: 'Home'          },
  { to: '/projects', label: 'Projects'      },
  { to: '/nearby',   label: 'Find Near Me'  },
  { to: '/about',    label: 'About'         },
  { to: '/admin',    label: 'Authority View' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-base tracking-tight">MPLAD-Sentinel</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
