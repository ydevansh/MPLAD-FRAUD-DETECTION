import { Link } from 'react-router-dom';
import { MapPin, Search, CheckCircle, ChevronRight, Building2, FileText, Users } from 'lucide-react';

const HOW_IT_WORKS = [
  { icon: FileText,    label: 'Official Project Data',  desc: 'Project info from MPLADS records' },
  { icon: Search,      label: 'View Project',            desc: 'Browse and search for projects' },
  { icon: CheckCircle, label: 'Check Progress',          desc: 'See expenditure and physical progress' },
  { icon: Users,       label: 'Citizen Verification',    desc: 'Coming in a later phase', soon: true },
];

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
              MPLAD-Sentinel
            </h1>
            <p className="text-xl text-blue-700 font-medium mb-3">
              Making MPLADS More Transparent and Easy to Verify
            </p>
            <p className="text-slate-600 text-lg mb-10 leading-relaxed">
              Find and understand MPLADS projects in your area. Track how public funds are being spent, check progress, and discover projects near you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/projects"
                className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-base">
                <Search size={18} />
                Explore Projects
              </Link>
              <Link to="/nearby"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3 rounded-xl border-2 border-slate-300 hover:border-blue-400 transition-colors text-base">
                <MapPin size={18} className="text-blue-600" />
                📍 Find Projects Near Me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Stats ─────────────────────────────────────────────────────── */}
      <section className="bg-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '24',    label: 'Projects Tracked' },
              { value: '5',     label: 'States' },
              { value: '₹21 Cr',label: 'Total Sanctioned' },
              { value: '4',     label: 'Risk Levels Monitored' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-bold">{s.value}</p>
                <p className="text-blue-200 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">How It Works</h2>
          <p className="text-slate-500">A simple process to bring transparency to public spending</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.label} className="relative">
              <div className={`bg-white rounded-2xl border p-6 h-full flex flex-col items-center text-center ${step.soon ? 'border-dashed border-slate-300 opacity-60' : 'border-slate-200'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${step.soon ? 'bg-slate-100' : 'bg-blue-50'}`}>
                  <step.icon size={22} className={step.soon ? 'text-slate-400' : 'text-blue-700'} />
                </div>
                <p className="font-semibold text-slate-800 mb-1">{step.label}</p>
                <p className="text-slate-500 text-sm">{step.desc}</p>
                {step.soon && (
                  <span className="mt-3 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Coming Soon</span>
                )}
              </div>
              {/* Arrow connector */}
              {i < HOW_IT_WORKS.length - 1 && (
                <ChevronRight size={20} className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-slate-300 z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature callout: Find Near Me ───────────────────────────────────── */}
      <section className="bg-white border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-center gap-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MapPin size={30} className="text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Find Projects Near You</h2>
            <p className="text-slate-500 text-sm">
              Allow your location to instantly see MPLADS projects in your area, sorted by distance.
              Check their progress and status on a live map.
            </p>
          </div>
          <Link to="/nearby"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-3 rounded-xl transition-colors">
            <MapPin size={16} />
            Find Near Me
          </Link>
        </div>
      </section>

      {/* ── Explore CTA ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
        <Building2 size={36} className="text-blue-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Browse All Projects</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          Search and filter across 24 prototype MPLADS projects by state, district, category, and status.
        </p>
        <Link to="/projects"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Explore All Projects <ChevronRight size={16} />
        </Link>
      </section>
    </div>
  );
}
