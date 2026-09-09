import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'

import { getHealth } from './services/api'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Phase 1 foundation</p>
      <h1 className="text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-4 max-w-xl text-slate-600">This route is ready for a future MPLAD-Sentinel phase.</p>
    </section>
  )
}

function HomePage() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'offline'>('checking')

  useEffect(() => {
    getHealth()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div>
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">MPLAD-Sentinel</p>
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">
          Public transparency, built one verified project at a time.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          The Phase 1 development foundation is running. Project discovery and verification features will arrive in later phases.
        </p>
      </div>
      <div className="border-l-4 border-emerald-500 bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Backend status</p>
        <p className="mt-4 text-2xl font-semibold text-slate-950">
          {status === 'checking' && 'Checking connection...'}
          {status === 'connected' && 'Connected'}
          {status === 'offline' && 'Unavailable'}
        </p>
        <p className="mt-2 text-sm text-slate-600">Health check: GET /api/health</p>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link className="font-bold tracking-tight text-slate-950" to="/">MPLAD-Sentinel</Link>
          <div className="flex gap-6 text-sm font-medium text-slate-600">
            <Link className="hover:text-emerald-700" to="/projects">Projects</Link>
            <Link className="hover:text-emerald-700" to="/admin">Admin</Link>
          </div>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
          <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
        </Routes>
      </main>
    </div>
  )
}