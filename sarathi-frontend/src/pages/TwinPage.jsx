import { Link } from 'react-router-dom';
import SchemeTimeline from '../components/twin/SchemeTimeline';
import ConflictResolver from '../components/twin/ConflictResolver';
import { useCitizen } from '../context/CitizenContext';

function TwinPage() {
  const { citizenProfile } = useCitizen();

  return (
    <div className="min-h-screen bg-off-white">
      {/* Hero */}
      <div className="bg-navy py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 font-body text-xs text-gray-400 mb-3">
            <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Digital Twin</span>
          </nav>
          <h1 className="font-display text-[28px] lg:text-[36px] text-white">
            Your Welfare Roadmap
          </h1>
          <p className="font-body text-sm text-gray-300 mt-1">
            In the next 3 years, you can rise above the poverty line.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Citizen Summary */}
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center">
              <span className="font-display text-lg text-saffron">
                {(citizenProfile.name || 'C')[0]}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-body text-base font-bold text-gray-900">
                {citizenProfile.name || 'Citizen'}
              </h2>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="px-2 py-0.5 bg-navy/5 rounded-full font-body text-xs text-gray-600">
                  Age: {citizenProfile.age || '—'}
                </span>
                <span className="px-2 py-0.5 bg-navy/5 rounded-full font-body text-xs text-gray-600">
                  Category: {citizenProfile.category || 'General'}
                </span>
                <span className="px-2 py-0.5 bg-navy/5 rounded-full font-body text-xs text-gray-600">
                  State: {citizenProfile.state || '—'}
                </span>
              </div>
            </div>
            <Link to="/chat" className="px-3 py-1.5 border border-saffron text-saffron font-body text-xs rounded-md hover:bg-saffron/5 transition-colors">
              Change Profile
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Current Income', value: `₹${(citizenProfile.income || 5000).toLocaleString('en-IN')}/mo`, color: '#6B7280' },
            { label: 'After 3 Years', value: `₹${((citizenProfile.income || 5000) + 8800).toLocaleString('en-IN')}/mo`, color: '#4CAF50' },
            { label: 'Total Annual Benefit', value: `₹${(64800).toLocaleString('en-IN')}`, color: '#E8740C' },
            { label: 'Active Schemes', value: '6', color: '#2196F3' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-card p-4">
              <p className="font-body text-xs text-gray-500">{card.label}</p>
              <p className="font-mono text-xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Income Trajectory Chart */}
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-6">
          <h3 className="font-body text-lg font-bold text-gray-900 mb-4">Income Trajectory</h3>
          <svg viewBox="0 0 600 200" className="w-full">
            <line x1="40" y1="170" x2="570" y2="170" stroke="#E5E2DA" strokeWidth="1" />
            <line x1="40" y1="80" x2="570" y2="80" stroke="#C0392B" strokeWidth="1" strokeDasharray="6 3" />
            <text x="567" y="73" fill="#C0392B" fontSize="10" fontFamily="DM Sans" textAnchor="end">Poverty Line</text>
            <path d="M40 155 Q130 145 220 120 Q310 95 400 65 Q490 45 560 30" stroke="#E8740C" strokeWidth="2.5" fill="none" />
            <path d="M40 155 Q130 145 220 120 Q310 95 400 65 Q490 45 560 30 L560 170 L40 170 Z" fill="#E8740C" opacity="0.06" />
            <text x="40" y="188" fill="#8A8578" fontSize="9" fontFamily="DM Sans">Now</text>
            <text x="220" y="188" fill="#8A8578" fontSize="9" fontFamily="DM Sans">Year 1</text>
            <text x="400" y="188" fill="#8A8578" fontSize="9" fontFamily="DM Sans">Year 2</text>
            <text x="555" y="188" fill="#8A8578" fontSize="9" fontFamily="DM Sans" textAnchor="end">Year 3</text>
          </svg>
        </div>

        {/* Timeline + Conflicts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SchemeTimeline />
          <ConflictResolver />
        </div>
      </div>
    </div>
  );
}

export default TwinPage;
