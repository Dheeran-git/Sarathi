/**
 * B1: Single source of truth for scheme category styles.
 * Eliminates duplicated categoryColors objects across 5 files.
 */

export const CATEGORY_STYLE = {
  agriculture: {
    pill: 'bg-green-100 text-green-800',
    detail: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    timeline: '#10b981',
    hex: '#4CAF50',
  },
  housing: {
    pill: 'bg-orange-100 text-orange-800',
    detail: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    timeline: '#f59e0b',
    hex: '#FF9800',
  },
  health: {
    pill: 'bg-red-100 text-red-800',
    detail: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    timeline: '#e11d48',
    hex: '#E53935',
  },
  education: {
    pill: 'bg-blue-100 text-blue-800',
    detail: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    timeline: '#3b82f6',
    hex: '#1565A8',
  },
  women: {
    pill: 'bg-pink-100 text-pink-800',
    detail: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
    timeline: '#ec4899',
    hex: '#C2185B',
  },
  employment: {
    pill: 'bg-purple-100 text-purple-800',
    detail: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    timeline: '#a855f7',
    hex: '#6A1B9A',
  },
};

export const FALLBACK_STYLE = {
  pill: 'bg-gray-100 text-gray-800',
  detail: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  timeline: '#64748b',
  hex: '#64748b',
};

export const CATEGORY_LABELS_EN = {
  agriculture: 'Agriculture',
  housing: 'Housing',
  health: 'Health',
  education: 'Education',
  women: 'Women & Child',
  employment: 'Employment',
};

export const CATEGORY_CHIPS = [
  { key: 'all',        label: 'All',          color: '#0F2240' },
  { key: 'agriculture',label: 'Agriculture',  color: '#4CAF50' },
  { key: 'housing',    label: 'Housing',      color: '#FF9800' },
  { key: 'health',     label: 'Health',       color: '#E53935' },
  { key: 'education',  label: 'Education',    color: '#1565A8' },
  { key: 'women',      label: 'Women & Child',color: '#C2185B' },
  { key: 'employment', label: 'Employment',   color: '#6A1B9A' },
];
