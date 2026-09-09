import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <span className="font-semibold text-slate-800">MPLAD-Sentinel</span>
            <span>·</span>
            <span>Making MPLADS More Transparent and Easy to Verify</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Prototype — data shown is for demonstration only and not real government records.
          </p>
        </div>
      </footer>
    </div>
  );
}
