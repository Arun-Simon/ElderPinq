import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, Bell, CheckCircle2, XCircle, Pill, TrendingUp,
  User, LogOut, RefreshCw, AlertTriangle, Clock
} from 'lucide-react';

const HEALTH_SERVICE_URL = import.meta.env.VITE_HEALTH_SERVICE_URL || 'http://localhost:3002';
const REMINDER_SERVICE_URL = import.meta.env.VITE_REMINDER_SERVICE_URL || 'http://localhost:3003';
const ALERT_SERVICE_URL = import.meta.env.VITE_ALERT_SERVICE_URL || 'http://localhost:3004';

// Hardcoded elder ID for demo — in production this comes from family profile linking
const ELDER_USER_ID = 1;

function StatusBadge({ status }) {
  const ok = status === 'feeling_well' || status === 'vitals_logged';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
      ok ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {ok ? 'Well' : 'Needs Attention'}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-5 border-t-4 ${color}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-6 h-6 text-gray-500" />
        <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-gray-800">{value ?? '—'}</p>
    </div>
  );
}

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [healthLogs, setHealthLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, rRes, aRes] = await Promise.allSettled([
        fetch(`${HEALTH_SERVICE_URL}/vitals/${ELDER_USER_ID}`),
        fetch(`${REMINDER_SERVICE_URL}/reminders/${ELDER_USER_ID}`),
        fetch(`${ALERT_SERVICE_URL}/alerts`),
      ]);
      if (hRes.status === 'fulfilled' && hRes.value.ok) setHealthLogs(await hRes.value.json());
      if (rRes.status === 'fulfilled' && rRes.value.ok) setReminders(await rRes.value.json());
      if (aRes.status === 'fulfilled' && aRes.value.ok) setAlerts(await aRes.value.json());
    } catch {/* silently ignore */}
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const latestLog = healthLogs[0];
  const medsTaken = reminders.filter((r) => r.taken).length;
  const medsTotal = reminders.length;
  const latestHR = healthLogs.find((l) => l.heart_rate)?.heart_rate;
  const latestBP = healthLogs.find((l) => l.blood_pressure)?.blood_pressure;

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-900 text-white px-6 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-indigo-300" />
          <span className="text-2xl font-extrabold">ElderPing</span>
          <span className="ml-2 bg-indigo-700 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Family View</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            id="refresh-btn"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button id="family-logout-btn" onClick={handleLogout} className="flex items-center gap-2 hover:text-indigo-300 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-500 text-sm">Monitoring</p>
            <h1 className="text-4xl font-extrabold text-gray-900">Elder Health Status</h1>
          </div>
          <div className="text-right text-sm text-gray-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Last updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* --- STATUS HERO CARD --- */}
        <div className={`rounded-3xl shadow-lg p-8 mb-8 flex items-center justify-between ${
          latestLog ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
        } text-white`}>
          <div className="flex items-center gap-5">
            <div className="bg-white/20 rounded-full p-5">
              <User className="w-12 h-12" />
            </div>
            <div>
              <p className="text-lg opacity-80">Overall Status</p>
              <p className="text-5xl font-extrabold mt-1">
                {latestLog ? '😊 Doing Well' : '❓ No Data Yet'}
              </p>
              {latestLog && (
                <p className="opacity-75 text-sm mt-1">
                  Last check-in: {new Date(latestLog.created_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {latestLog && <CheckCircle2 className="w-20 h-20 opacity-30" />}
        </div>

        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={HeartPulse} label="Heart Rate" value={latestHR ? `${latestHR} bpm` : null} color="border-red-400" />
          <StatCard icon={TrendingUp} label="Blood Pressure" value={latestBP} color="border-blue-400" />
          <StatCard icon={CheckCircle2} label="Check-ins (Today)" value={healthLogs.filter(l => l.status === 'feeling_well').length} color="border-green-400" />
          <StatCard icon={Pill} label="Meds Taken" value={medsTotal > 0 ? `${medsTaken}/${medsTotal}` : '—'} color="border-purple-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Medication Status */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-purple-700 px-5 py-4 flex items-center gap-2">
              <Pill className="w-6 h-6 text-purple-200" />
              <h2 className="text-xl font-bold text-white">Medication Tracker</h2>
            </div>
            {reminders.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No medications scheduled.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-bold text-gray-800">{r.medication_name}</p>
                      <p className="text-sm text-gray-500">{r.dosage} &bull; {r.time_of_day?.slice(0,5)}</p>
                    </div>
                    {r.taken
                      ? <span className="flex items-center gap-1 text-green-600 font-semibold text-sm"><CheckCircle2 className="w-5 h-5" /> Taken</span>
                      : <span className="flex items-center gap-1 text-yellow-600 font-semibold text-sm"><XCircle className="w-5 h-5" /> Pending</span>
                    }
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Health Trend */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-blue-700 px-5 py-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-200" />
              <h2 className="text-xl font-bold text-white">Recent Health Logs</h2>
            </div>
            {healthLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No logs yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {healthLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <StatusBadge status={log.status} />
                      {log.heart_rate && <p className="text-sm text-gray-500 mt-1">HR: {log.heart_rate} bpm &bull; BP: {log.blood_pressure}</p>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-red-700 px-5 py-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-red-200" />
              <h2 className="text-xl font-bold text-white">System Alerts</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id} className="px-5 py-4 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${a.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-semibold text-gray-800">[{a.service_name}] {a.message}</p>
                    <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
