import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Thermometer, TrendingUp, TrendingDown, AlertTriangle, Droplets, Wind } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { LeafSVG, WheatSVG, SunSVG, DropSVG } from '../components/LeafIcons'
import { fetchDashboard } from '../api/farmer'

// ── Mini sparkline data ────────────────────────────────────
const moistureData = [55,58,52,60,65,61,63,59,67,64,70,68].map((v,i) => ({ i, v }))
const priceData    = [2100,2150,2080,2200,2180,2240,2210,2280,2260,2300,2290,2350].map((v,i) => ({ i, v }))

const RISK_STYLE = {
  low:      { bg: 'risk-low',      dot: '#22c55e' },
  medium:   { bg: 'risk-medium',   dot: '#f59e0b' },
  high:     { bg: 'risk-high',     dot: '#ef4444' },
  critical: { bg: 'risk-critical', dot: '#a855f7' },
}

// ── Animated counter ──────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = to / 40
    const timer = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [to])
  return <>{val}{suffix}</>
}

// ── Weather mini-card ─────────────────────────────────────
function WeatherCard({ icon, label, value, color }) {
  return (
    <div className="glass-card stat-card p-4 flex items-center gap-3 animate-slide-up">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-stone-400 font-medium">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}

// ── Live Mandi Price Widget ───────────────────────────────
function MandiPrices() {
  const [prices, setPrices] = useState([])
  const [crop, setCrop]     = useState('Wheat')
  const [isAuto, setIsAuto] = useState(true)

  const rotatingCrops = ['Wheat', 'Rice', 'Maize']

  useEffect(() => {
    // API Call with Fallback Dummy Data
    fetch(`/api/market/prices?commodity=${crop}&limit=5`)
      .then(r => {
        if(!r.ok) throw new Error("API failed");
        return r.json();
      })
      .then(d => setPrices(d.records || []))
      .catch(err => {
        console.warn("Mandi API slow/failed. Loading dummy data for:", crop);
        // Agar API fail ho jaye toh ye dummy data dikhayega taaki screen blank na ho
        setPrices([
          { market: "Krishi Mandi", district: "Demo District", state: "Local", modal_price: crop === 'Rice' ? "2950" : "2200", min_price: "2100", max_price: "2300" },
          { market: "Azadpur", district: "Delhi", state: "Delhi", modal_price: crop === 'Maize' ? "1850" : "2250", min_price: "1800", max_price: "2400" }
        ]);
      });
  }, [crop])

  // Auto-rotate logic
  useEffect(() => {
    if (!isAuto) return;

    const timer = setInterval(() => {
      setCrop(prevCrop => {
        const currentIndex = rotatingCrops.indexOf(prevCrop);
        if (currentIndex === -1) return rotatingCrops[0];
        
        const nextIndex = (currentIndex + 1) % rotatingCrops.length;
        return rotatingCrops[nextIndex];
      });
    }, 7000); 

    return () => clearInterval(timer);
  }, [isAuto]);

  const handleManualSelection = (e) => {
    setCrop(e.target.value);
    setIsAuto(false);
  }

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl text-stone-700 flex items-center gap-2">
          🏪 Live Mandi Prices
        </h3>
        <select
          value={crop} 
          onChange={handleManualSelection}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all">
          {['Wheat','Rice','Maize','Onion','Potato','Cotton'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-3">
        {prices?.length === 0
          ? <div className="animate-pulse flex space-x-4 py-4">
              <div className="flex-1 space-y-3 py-1">
                <div className="h-2 bg-stone-200 rounded"></div>
                <div className="h-2 bg-stone-200 rounded w-5/6"></div>
              </div>
            </div>
          : prices?.map((p, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-stone-100 last:border-0 text-sm">
              <div>
                <p className="font-semibold text-stone-700">{p.market}</p>
                <p className="text-xs text-stone-400 mt-0.5">{p.district}, {p.state}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 text-base">₹{p.modal_price}<span className="text-xs text-stone-500 font-normal">/q</span></p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {p.min_price} – {p.max_price}
                </p>
              </div>
            </div>
          ))
        }
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
        <p className="text-[10px] text-stone-400">Source: data.gov.in · Agmarknet</p>
        {isAuto && <span className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Auto-updating</span>}
      </div>
    </div>
  )
}

// ── Main Dashboard Component ──────────────────────────────
export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime]       = useState(new Date())

  // Default Fallback Data
  const fallbackData = {
    last_crop: 'Wheat', 
    temperature: '32°C',
    price_trend: '+4.2%', 
    open_alerts: 2,
    recent_risks: [
      { level: 'high',   message: 'Late Blight detected in north block.' },
      { level: 'medium', message: 'Soil K deficit 35 kg/ha in field 3.' },
    ]
  };

  useEffect(() => {
    let isMounted = true;

    // Timeout: Agar API 3 second me response nahi deti, to fallback data dikha do
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("API slow hai! Timeout triggered, showing fallback data.");
        setData(fallbackData);
        setLoading(false);
      }
    }, 3000); // 3 Seconds wait

    fetchDashboard()
      .then((res) => {
        if (isMounted) {
          clearTimeout(timeoutId);
          setData(res || fallbackData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("fetchDashboard failed, using fallback data", err);
          clearTimeout(timeoutId);
          setData(fallbackData);
          setLoading(false);
        }
      });

    const t = setInterval(() => setTime(new Date()), 60000);
    return () => {
      isMounted = false;
      clearInterval(t);
      clearTimeout(timeoutId);
    }
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-float">
        <LeafSVG size={48} color="#3d8b47" />
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-stone-500">
      Failed to load dashboard data. Please try refreshing.
    </div>
  )

  const isUp = data?.price_trend?.includes('+') || false;

  return (
    <div className="space-y-8">

      {/* ── Hero banner ──────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden p-8"
        style={{
          background: 'linear-gradient(135deg, #1a3d1f 0%, #2d6a35 50%, #3d8b47 100%)',
          minHeight: 180,
        }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5db356, transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #e8a020, transparent)', transform: 'translate(0, 40%)' }} />

        <div className="absolute right-8 bottom-0 opacity-70 animate-float">
          <WheatSVG />
        </div>
        <div className="absolute right-32 bottom-0 opacity-50 animate-sway" style={{ animationDelay: '0.5s' }}>
          <WheatSVG />
        </div>

        <div className="relative z-10">
          <p className="text-green-300 text-sm font-medium tracking-widest uppercase mb-1">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Good {time.getHours() < 12 ? 'Morning' : time.getHours() < 17 ? 'Afternoon' : 'Evening'}
          </p>
          <h1 className="font-display text-white text-4xl mb-3">
            Farm Overview
          </h1>
          <p className="text-green-200/70 text-sm max-w-md">
            Real-time AI intelligence for your fields — disease detection, crop advisory, and market insights.
          </p>
          <Link to="/analyze"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:gap-3"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Scan Your Field Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Weather strip ─────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <WeatherCard
          icon={<SunSVG className="w-5 h-5" />}
          label="Temperature" value={data?.temperature || '--°C'}
          color="#e8a020"
        />
        <WeatherCard
          icon={<Droplets className="w-5 h-5" style={{ color:'#4a90d9' }} />}
          label="Humidity" value="68%"
          color="#4a90d9"
        />
        <WeatherCard
          icon={<Wind className="w-5 h-5" style={{ color:'#6b7280' }} />}
          label="Wind" value="12 km/h"
          color="#6b7280"
        />
        <WeatherCard
          icon={<AlertTriangle className="w-5 h-5" style={{ color:'#ef4444' }} />}
          label="Open Alerts" value={data?.open_alerts || '0'}
          color="#ef4444"
        />
      </div>

      {/* ── Stat + chart row ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Crop card */}
        <div className="glass-card stat-card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Last Crop</p>
            <div className="animate-float" style={{ animationDelay: '0.3s' }}>
              <LeafSVG size={28} color="#3d8b47" />
            </div>
          </div>
          <p className="font-display text-3xl text-stone-800">{data?.last_crop || 'N/A'}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-600 font-medium">Healthy Season</span>
          </div>
        </div>

        {/* Moisture chart */}
        <div className="glass-card stat-card p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Soil Moisture</p>
            <DropSVG className="w-5 h-6" color="#4a90d9" />
          </div>
          <p className="font-display text-3xl text-stone-800 mb-2">
            <Counter to={68} suffix="%" />
          </p>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={moistureData}>
              <defs>
                <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4a90d9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4a90d9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#4a90d9" strokeWidth={2} fill="url(#mGrad)" dot={false}/>
              <Tooltip contentStyle={{ background:'rgba(26,61,31,0.85)', border:'none', borderRadius:8, color:'white', fontSize:11 }} formatter={v => [v+'%','Moisture']} labelFormatter={() => ''} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Price chart */}
        <div className="glass-card stat-card p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Market Price</p>
            {isUp
              ? <TrendingUp className="w-4 h-4 text-green-500" />
              : <TrendingDown className="w-4 h-4 text-red-500" />}
          </div>
          <p className={`font-display text-3xl mb-2 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {data?.price_trend || 'N/A'}
          </p>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3d8b47" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3d8b47" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#3d8b47" strokeWidth={2} fill="url(#pGrad)" dot={false}/>
              <Tooltip contentStyle={{ background:'rgba(26,61,31,0.85)', border:'none', borderRadius:8, color:'white', fontSize:11 }} formatter={v => ['₹'+v+'/q','Price']} labelFormatter={() => ''} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Two Column Layout: Risk Events & Mandi Prices ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Column: Risk Events */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="font-display text-xl text-stone-700 mb-5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Recent Risk Events
          </h2>
          <div className="space-y-3">
            {data?.recent_risks?.length > 0 ? data.recent_risks.map((r, i) => {
              const style = RISK_STYLE[r.level] || RISK_STYLE.medium
              return (
                <div key={i}
                  className={`flex items-start gap-3 p-4 rounded-2xl ${style.bg} animate-slide-up`}
                  style={{ animationDelay: `${300 + i * 60}ms` }}>
                  <div className="relative mt-0.5 shrink-0">
                    <div className="w-3 h-3 rounded-full" style={{ background: style.dot }} />
                    <div className="ripple-dot" style={{ top:-4, left:-4, background: style.dot + '55' }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide opacity-60">{r.level}</span>
                    <p className="text-sm font-medium mt-0.5">{r.message}</p>
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm text-stone-500">No recent risk events detected.</p>
            )}
          </div>
        </div>

        {/* Right Column: Live Mandi Prices Component */}
        <MandiPrices />

      </div>

      {/* ── CTA ───────────────────────────────────────────── */}
      <Link to="/analyze" className="btn-primary inline-flex items-center gap-2 text-sm mt-8">
        Run New Field Analysis <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}