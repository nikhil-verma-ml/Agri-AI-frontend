import { useState } from 'react'
import { ClockIcon, Search, TrendingUp } from 'lucide-react'
import { LeafSVG } from '../components/LeafIcons'
import clsx from 'clsx'

const HISTORY = [
  { id: 4, date: '2026-04-29', crop: 'Wheat',  disease: 'Healthy',      risk: 'low',      location: 'Field A', area: 2.5, advisory: 'Crop healthy, maintain irrigation.' },
  { id: 3, date: '2026-04-22', crop: 'Rice',   disease: 'Leaf Rust',    risk: 'high',     location: 'Field B', area: 1.8, advisory: 'Apply fungicide immediately.' },
  { id: 2, date: '2026-04-15', crop: 'Maize',  disease: 'Early Blight', risk: 'high',     location: 'Field A', area: 3.0, advisory: 'Reduce irrigation, apply Mancozeb.' },
  { id: 1, date: '2026-04-08', crop: 'Cotton', disease: 'Healthy',      risk: 'low',      location: 'Field C', area: 4.2, advisory: 'Soil pH optimal. Continue monitoring.' },
]

const RISK_STYLE = {
  low:      'risk-low',
  medium:   'risk-medium',
  high:     'risk-high',
  critical: 'risk-critical',
}
const CROP_EMOJI = { Wheat:'🌾', Rice:'🌾', Maize:'🌽', Cotton:'🪴', Soybean:'🫘', default:'🌿' }

export default function HistoryPage() {
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = HISTORY.filter(h =>
    h.crop.toLowerCase().includes(search.toLowerCase()) ||
    h.disease.toLowerCase().includes(search.toLowerCase()) ||
    h.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Records</p>
        <h1 className="font-display text-4xl text-stone-800 flex items-center gap-3">
          <ClockIcon className="w-8 h-8 text-stone-400" /> History
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Analyses', value: HISTORY.length,                         color: '#3d8b47' },
          { label: 'Diseases Found', value: HISTORY.filter(h => h.disease !== 'Healthy').length, color: '#ef4444' },
          { label: 'Healthy Crops',  value: HISTORY.filter(h => h.disease === 'Healthy').length, color: '#22c55e' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center animate-slide-up" style={{ animationDelay: `${i*60}ms` }}>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-stone-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by crop, disease or location..."
          className="field-input pl-10"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="flex justify-center mb-3 animate-float">
              <LeafSVG size={48} color="#3d8b47" />
            </div>
            <p className="text-stone-400">No records found</p>
          </div>
        ) : filtered.map((h, i) => (
          <div key={h.id} className="animate-slide-up" style={{ animationDelay: `${i*50}ms` }}>
            <div
              className="glass-card p-5 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setExpanded(expanded === h.id ? null : h.id)}
            >
              <div className="flex items-center gap-4">
                {/* Crop emoji */}
                <div className="text-3xl shrink-0">
                  {CROP_EMOJI[h.crop] || CROP_EMOJI.default}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-stone-800">{h.crop}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold', RISK_STYLE[h.risk])}>
                      {h.risk}
                    </span>
                    <span className="text-xs text-stone-400">{h.location} · {h.area} ha</span>
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">{h.disease}</p>
                </div>

                {/* Date + chevron */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-stone-400">{h.date}</p>
                  <p className="text-xs text-stone-300 mt-0.5">
                    {expanded === h.id ? '▲ collapse' : '▼ expand'}
                  </p>
                </div>
              </div>

              {/* Expanded advisory */}
              {expanded === h.id && (
                <div className="mt-4 pt-4 border-t border-stone-100 animate-slide-up">
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Advisory given
                  </p>
                  <p className="text-sm text-stone-600 italic">"{h.advisory}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}