import { Shield, Eye, MapPin, Cpu, Users, FileCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border border-blue-200">
          <Shield size={14} />
          <span>Public Transparency Initiative</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Empowering Citizens with Transparent Civic Auditing
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          MPLAD-Sentinel bridges the gap between central government fund allocations and physical ground reality through intuitive public discovery and geo-spatial tracking.
        </p>
      </div>

      {/* What is MPLADS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 mb-10 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">What is MPLADS?</h2>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-4">
          The <strong>Member of Parliament Local Area Development Scheme (MPLADS)</strong> enables Members of Parliament to recommend works of developmental nature with emphasis on the creation of durable community assets based on locally felt needs. Under the scheme, each MP has the choice to suggest developmental works to the tune of <strong>₹5 Crore per annum</strong> to be taken up in their constituency.
        </p>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
          Crucial community infrastructure—such as drinking water facilities, primary healthcare centers, village roads, school classrooms, and sanitation networks—is funded through this scheme across rural and urban India.
        </p>
      </div>

      {/* The Core Pillars */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
          The Four Pillars of MPLAD-Sentinel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Eye size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">1. Open Public Discovery</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every citizen can effortlessly search and inspect sanctioned projects across their state, district, and constituency without navigating cumbersome portals.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <MapPin size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">2. Geo-Spatial Proximity</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Find works happening within 5 km to 50 km of your home. Interactive maps connect digital records to real physical sites on the ground.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">3. Discrepancy & Anomaly Auditing</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Algorithmic verification flags unusual expenditure patterns—such as 90% funds expended with only 20% physical progress or prolonged stalled durations.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">4. Citizen Verification Loop</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In future phases, verified citizens can upload geotagged photos from project sites, enabling authorities and the public to corroborate physical completion.
            </p>
          </div>
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm mb-1">Prototype & Hackathon Demonstration Notice</h4>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              MPLAD-Sentinel is currently an academic prototype built for proof-of-concept demonstration. The project records, financial figures, photographs, and risk assessments present in this prototype are generated representative data and do not reflect official audit findings or live MoSPI / e-SAKSHI government databases.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md text-sm"
        >
          <FileCheck size={16} />
          <span>Explore Public Projects Catalog</span>
        </Link>
      </div>
    </div>
  );
}
