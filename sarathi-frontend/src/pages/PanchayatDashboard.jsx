import { useState } from 'react';
import { Link } from 'react-router-dom';
import AlertsPanel from '../components/panchayat/AlertsPanel';
import CitizenTable from '../components/panchayat/CitizenTable';
import { panchayatStats, alerts, eligibleCitizens } from '../data/mockPanchayat';

function PanchayatDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 font-body text-xs text-gray-400 mb-3">
            <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Panchayat Dashboard</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[28px] lg:text-[36px] text-white">
                {panchayatStats.panchayatNameEnglish || 'Rampur Panchayat'}
              </h1>
              <p className="font-body text-sm text-gray-300 mt-1">
                Barabanki, Uttar Pradesh
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-body text-xs text-gray-400">
                Last Updated: 2 hours ago
              </span>
              <button className="h-9 px-4 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors">
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Households', value: panchayatStats.totalHouseholds, color: '#0F2240' },
            { label: 'Receiving Benefits', value: panchayatStats.receiving, color: '#4CAF50' },
            { label: 'Eligible But Unserved', value: panchayatStats.eligibleNotEnrolled, color: '#FF9800' },
            { label: 'Zero Benefits', value: panchayatStats.zeroBenefits, color: '#F44336' },
            { label: 'Added This Month', value: panchayatStats.addedThisMonth, color: '#2196F3' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-card p-4">
              <p className="font-body text-xs text-gray-500">{card.label}</p>
              <p className="font-mono text-2xl font-bold mt-1" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Alert Panel */}
          <div className="lg:col-span-1">
            <AlertsPanel alerts={alerts} />
          </div>

          {/* Right: Village Map placeholder */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-4 lg:p-6">
            <h3 className="font-body text-lg font-bold text-gray-900 mb-4">Village Map</h3>
            <div className="aspect-[16/9] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="font-body text-sm text-gray-400">Interactive map coming soon</p>
            </div>
          </div>
        </div>

        {/* Citizen Table */}
        <CitizenTable citizens={eligibleCitizens} />
      </div>
    </div>
  );
}

export default PanchayatDashboard;
