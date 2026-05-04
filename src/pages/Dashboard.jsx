import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, Thermometer, AlertTriangle, Droplets, Wind, 
  CloudRain, Sun, Cloud, Sunrise, Sunset, Activity, CalendarDays, User 
} from 'lucide-react'
import { ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { LeafSVG, WheatSVG, SunSVG, DropSVG } from '../components/LeafIcons'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebaseConfig'
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { ScanSearch, Leaf } from 'lucide-react'

// ── Seasonal Sowing Logic (No API needed, just pure logic) ─────
const getSowingAdvisory = () => {
  const month = new Date().getMonth(); // 0 = Jan, 3 = April
  if (month >= 2 && month <= 5) return { season: "Zaid (Summer)", crops: "Moong, Urad, Pumpkin, Cucumber" };
  if (month >= 6 && month <= 10) return { season: "Kharif (Monsoon)", crops: "Rice, Maize, Soyabean, Cotton" };
  return { season: "Rabi (Winter)", crops: "Wheat, Mustard, Barley, Peas" };
};

// ── Animated counter ──────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0;
    const step = to / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 20);
    return () => clearInterval(timer)
  }, [to])
  return <>{val}{suffix}</>
}

// ── Improved Weather Mini-Card ────────────────────────────
function WeatherCard({ icon, label, value, color, desc }) {
  return (
    <div className="glass-card stat-card p-4 flex items-center gap-3 animate-slide-up">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>{value}</p>
        {desc && <p className="text-[9px] text-stone-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

// ── Helper for Weather Icons ──────────────────────────────
const getWeatherIcon = (condition) => {
  switch(condition) {
    case 'Rain': return <CloudRain className="w-5 h-5 text-blue-500" />;
    case 'Clouds': return <Cloud className="w-5 h-5 text-gray-400" />;
    case 'Clear': return <Sun className="w-5 h-5 text-yellow-500" />;
    default: return <Cloud className="w-5 h-5 text-gray-400" />;
  }
}

// ── Main Dashboard Component ──────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [riskData, setRiskData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);
  
  const advisory = getSowingAdvisory();

  const [weather, setWeather] = useState({
    temp: '--', humidity: 0, wind: '--', rainProb: '0%', 
    aqi: '--', aqiDesc: 'Loading...', sunrise: '--:--', sunset: '--:--',
    forecast: [], chartData: [], isLoaded: false
  });

  useEffect(() => {
    let isMounted = true;
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

    const fetchData = async () => {
      try {
        // 1. Fetch User Profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let lat = 26.8467; // Default: Lucknow
        let lon = 80.9462;
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          if (data.location?.lat && data.location?.lon) {
            lat = data.location.lat;
            lon = data.location.lon;
          }
        }

        // 2. Fetch Recent History
        const historyQuery = query(
          collection(db, 'history'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const historySnap = await getDocs(historyQuery);
        setHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 2. Current Weather + Sun Times
        const currRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const curr = await currRes.json();

        // 3. Air Pollution (AQI)
        const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const aqiData = await aqiRes.json();

        // 4. 5-Day Forecast
        const foreRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const fore = await foreRes.json();

        if (isMounted) {
          const humidityHistory = fore.list.slice(0, 10).map((item, idx) => ({ i: idx, v: item.main.humidity }));
          const daily = {};
          fore.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!daily[date]) daily[date] = { temps: [], weather: item.weather[0].main, pop: item.pop };
            daily[date].temps.push(item.main.temp);
          });

          const formattedForecast = Object.keys(daily).slice(0, 5).map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
            max: Math.round(Math.max(...daily[date].temps)),
            weather: daily[date].weather,
            rain: Math.round(daily[date].pop * 100)
          }));

          const aqiValue = aqiData.list[0].main.aqi;
          const aqiLevels = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];

          setWeather({
            temp: Math.round(curr.main.temp),
            humidity: curr.main.humidity,
            wind: (curr.wind.speed * 3.6).toFixed(1),
            aqi: aqiValue,
            aqiDesc: aqiLevels[aqiValue],
            sunrise: new Date(curr.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(curr.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            forecast: formattedForecast,
            chartData: humidityHistory,
            rainProbNow: Math.round(fore.list[0].pop * 100) + '%',
            locationName: curr.name,
            isLoaded: true
          });

          setRiskData([
            { level: 'high', message: curr.main.humidity > 70 ? 'High Humidity: Risk of Fungal infection increased.' : 'Soil nitrogen check recommended.' },
            { level: 'medium', message: 'Optimized spraying window: Next 4 hours (Low Wind).' }
          ]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      }
    };

    fetchData();
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => { isMounted = false; clearInterval(t); }
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64 animate-pulse"><LeafSVG size={48} color="#3d8b47" /></div>

  return (
    <div className="space-y-8 pb-10">
      {/* ── User Profile Header ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 border-b-4 border-[var(--leaf)]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--leaf-light)] flex items-center justify-center text-white text-2xl font-bold shadow-inner">
            {userData?.farmName?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800">{userData?.farmName || 'Kisan Mitra'}</h2>
            <p className="text-sm text-stone-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono bg-stone-100 text-stone-400 px-2 py-0.5 rounded">UID: {user.uid.slice(0, 8)}...</span>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">Verified Farmer</span>
            </div>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-stone-400 font-bold uppercase mb-1">Current Focus</p>
          <div className="flex items-center gap-2 text-stone-700 font-semibold">
            <Wheat className="w-4 h-4 text-[var(--harvest)]" />
            {advisory.season} Crop Care
          </div>
        </div>
      </div>

      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden p-8 text-white shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #1a3d1f 0%, #2d6a35 100%)' }}>
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-2">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {weather.locationName || 'Local Sector'}
          </p>
          <h1 className="font-display text-4xl mb-2">Field Intelligence</h1>
          <p className="text-green-100/70 text-sm max-w-lg">Monitoring factors for your {advisory.season} yields. Last synced: {new Date().toLocaleTimeString()}</p>
          <Link to="/analyze" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition-all">
            Start AI Plant Scan <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-20"><WheatSVG size={240} /></div>
      </div>

      {/* ── Real-time Weather Strip ────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <WeatherCard icon={<Thermometer color="#e8a020"/>} label="Temp" value={`${weather.temp}°C`} color="#e8a020" desc="Current Air Temp" />
        <WeatherCard icon={<Droplets color="#3b82f6"/>} label="Humidity" value={`${weather.humidity}%`} color="#3b82f6" desc="Air Moisture Content" />
        <WeatherCard icon={<Activity color="#22c55e"/>} label="Air Quality" value={weather.aqiDesc} color="#22c55e" desc={`AQI Level: ${weather.aqi}`} />
        <WeatherCard icon={<CloudRain color="#8b5cf6"/>} label="Precipitation" value={weather.rainProbNow} color="#8b5cf6" desc="Chance of Rain" />
      </div>

      {/* ── Actionable Insights ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Seasonal Sowing Card */}
        <div className="glass-card p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <CalendarDays className="text-green-600" />
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">Sowing Advisory</span>
          </div>
          <p className="text-xs text-stone-400 font-bold uppercase">Active Season</p>
          <h3 className="text-xl font-bold text-stone-800">{advisory.season}</h3>
          <p className="text-sm text-stone-600 mt-2">Recommended: <span className="font-semibold text-green-700">{advisory.crops}</span></p>
        </div>

        {/* Humidity Graph */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-stone-400 font-bold uppercase">Humidity Trend</p>
            <DropSVG color="#3b82f6" />
          </div>
          <p className="text-2xl font-bold text-stone-800"><Counter to={weather.humidity} suffix="%" /></p>
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weather.chartData}>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f633" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sun Cycle Card */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="flex justify-between mb-4">
             <p className="text-xs text-stone-400 font-bold uppercase">Sunlight Cycle</p>
             <Sun className="text-orange-400 w-5 h-5 animate-spin-slow" />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-orange-500" />
              <div><p className="text-[10px] text-stone-400">Sunrise</p><p className="font-bold text-sm">{weather.sunrise}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-purple-500" />
              <div><p className="text-[10px] text-stone-400">Sunset</p><p className="font-bold text-sm">{weather.sunset}</p></div>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-green-600 font-bold">✓ High UV window: 11 AM - 3 PM</div>
        </div>
      </div>

      {/* ── Forecast & Risks ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Analysis History */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
              <Activity className="text-blue-500" /> Recent Activity
            </h2>
            <Link to="/history" className="text-xs font-bold text-[var(--leaf)] hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", 
                  item.diseaseDetected === 'Healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{item.diseaseDetected}</p>
                  <p className="text-xs text-stone-500 capitalize">{item.locationName} • {new Date(item.timestamp?.toDate()).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-400 uppercase leading-none mb-1">Crop</p>
                  <p className="text-sm font-bold text-green-700">{item.cropRecommendation}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <ScanSearch className="text-stone-300 w-6 h-6" />
                </div>
                <p className="text-sm text-stone-400">No analyses yet.</p>
                <Link to="/analyze" className="text-xs font-bold text-[var(--leaf)] mt-2 inline-block">Analyze your first field</Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Alerts */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2"><AlertTriangle className="text-amber-500" /> AI Farm Alerts</h2>
          <div className="space-y-4">
            {riskData.map((r, i) => (
              <div key={i} className={`p-4 rounded-2xl flex gap-3 items-start border-l-4 ${r.level === 'high' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 ${r.level === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-tighter">{r.level} Risk</p>
                  <p className="text-sm font-medium text-stone-800">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}