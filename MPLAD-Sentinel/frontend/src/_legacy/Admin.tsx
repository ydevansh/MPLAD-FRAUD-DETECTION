export default function Admin() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex items-center justify-center w-14 h-14 rounded-xl bg-slate-800 border border-slate-700">
        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Authority Dashboard</h1>
      <p className="text-slate-500 text-sm max-w-sm">
        The authority login and management panel will be available in a later phase.
      </p>
      <span className="mt-6 inline-block bg-slate-800 border border-slate-700 text-slate-500 text-xs px-3 py-1 rounded-full">
        Coming in a later phase
      </span>
    </main>
  );
}
