import { useState, useEffect } from 'react'
import { ClockIcon, Search, TrendingUp } from 'lucide-react'
import { LeafSVG } from '../components/LeafIcons'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebaseConfig'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import clsx from 'clsx'

const RISK_STYLE = {
  low:      'risk-low',
  medium:   'risk-medium',
  high:     'risk-high',
  critical: 'risk-critical',
}
const CROP_EMOJI = { Wheat:'🌾', Rice:'🌾', Maize:'🌽', Cotton:'🪴', Soybean:'🫘', default:'🌿' }

export default function HistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return
      try {
        const q = query(
          collection(db, 'history'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        )
        const snap = await getDocs(q)
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error("History fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [user])

  const filtered = history.filter(h =>
    h.cropRecommendation?.toLowerCase().includes(search.toLowerCase()) ||
    h.diseaseDetected?.toLowerCase().includes(search.toLowerCase()) ||
    h.locationName?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center min-h-[400px] animate-pulse"><LeafSVG size={48} color="#3d8b47" /></div>

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
          { label: 'Total Analyses', value: history.length,                         color: '#3d8b47' },
          { label: 'Diseases Found', value: history.filter(h => h.diseaseDetected !== 'Healthy').length, color: '#ef4444' },
          { label: 'Healthy Crops',  value: history.filter(h => h.diseaseDetected === 'Healthy').length, color: '#22c55e' },
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
                <div className="text-3xl shrink-0">
                  {CROP_EMOJI[h.cropRecommendation] || CROP_EMOJI.default}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-stone-800">{h.cropRecommendation}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-500')}>
                      {(h.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <span className="text-xs text-stone-400">{h.locationName} · {h.formSnapshot?.area_ha} ha</span>
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">{h.diseaseDetected}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-stone-400">
                    {new Date(h.timestamp?.toDate()).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-stone-300 mt-0.5">
                    {expanded === h.id ? '▲ collapse' : '▼ expand'}
                  </p>
                </div>
              </div>

              {expanded === h.id && (
                <div className="mt-4 pt-4 border-t border-stone-100 animate-slide-up">
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Input Context
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg">
                    <p>Nitrogen: {h.formSnapshot.nitrogen} kg/ha</p>
                    <p>Phosphorus: {h.formSnapshot.phosphorus} kg/ha</p>
                    <p>Potassium: {h.formSnapshot.potassium} kg/ha</p>
                    <p>pH Level: {h.formSnapshot.ph}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}