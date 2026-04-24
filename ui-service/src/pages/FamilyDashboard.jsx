import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, Bell, CheckCircle2, XCircle, Pill, TrendingUp,
  User, LogOut, RefreshCw, AlertTriangle, Clock
} from 'lucide-react';
import { getCachedUser, logout, getUserById } from '../api/authApi';
import { getVitals } from '../api/healthApi';
import { getReminders } from '../api/reminderApi';
import { getAlerts } from '../api/alertApi';

// In a real app this would come from a "linked elder" profile.
// For demo purposes the elder is the first user registered with role='elder'.
// The family member selects whose data to view; here we default to userId=1.
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
  const user = getCachedUser();

  const [healthLogs, setHealthLogs]   = useState([]);
  const [reminders, setReminders]     = useState([]);
  const [alerts, setAlerts]           = useState([]);
  const [elderName, setElderName]     = useState('');
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      // Run all fetches concurrently; surface individual errors
      const [hResult, rResult, aResult, uResult] = await Promise.allSettled([
        getVitals(ELDER_USER_ID),
        getReminders(ELDER_USER_ID),
        getAlerts(),
        getUserById(ELDER_USER_ID)
      ]);

      if (hResult.status === 'fulfilled') setHealthLogs(hResult.value);
      if (rResult.status === 'fulfilled') setReminders(rResult.value);
      if (aResult.status === 'fulfilled') setAlerts(aResult.value);
      if (uResult.status === 'fulfilled' && uResult.value?.username) {
        setElderName(uResult.value.username);
      }

      // Show a warning if any service failed
      const failed = [hResult, rResult, aResult]
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message);
      if (failed.length) setFetchError(`Some data could not be loaded: ${failed.join('; ')}`);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLastRefresh(new Date());
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const latestLog  = healthLogs[0];
  const medsTaken  = reminders.filter((r) => r.taken).length;
  const medsTotal  = reminders.length;
  const latestHR   = healthLogs.find((l) => l.heart_rate)?.heart_rate;
  const latestBP   = healthLogs.find((l) => l.blood_pressure)?.blood_pressure;
  const checkIns   = healthLogs.filter((l) => l.status === 'feeling_well').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-900 text-white px-6 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-indigo-300" />
          <span className="text-2xl font-extrabold">ElderPing</span>
          <span className="ml-2 bg-indigo-700 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Family View
          </span>
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
          <button
            id="family-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 hover:text-indigo-300 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm">Monitoring</p>
            <h1 className="text-4xl font-extrabold text-gray-900 capitalize">
              {elderName ? `${elderName}'s Health Status` : 'Elder Health Status'}
            </h1>
          </div>
          <div className="text-right text-sm text-gray-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Last updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Partial error banner */}
        {fetchError && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 text-yellow-800 rounded-xl p-4 text-base font-medium">
            ⚠️ {fetchError}
          </div>
        )}

        {/* Status hero card */}
        <div className={`rounded-3xl shadow-lg p-8 mb-8 flex items-center justify-between text-white ${
          loading
            ? 'bg-gray-400'
            : latestLog
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}>
          <div className="flex items-center gap-5">
            <div className="bg-white/20 rounded-full p-5">
              <User className="w-12 h-12" />
            </div>
            <div>
              <p className="text-lg opacity-80">Overall Status</p>
              <p className="text-5xl font-extrabold mt-1">
                {loading ? '⏳ Loading…' : latestLog ? '😊 Doing Well' : '❓ No Data Yet'}
              </p>
              {latestLog && (
                <p className="opacity-75 text-sm mt-1">
                  Last check-in: {new Date(latestLog.created_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {latestLog && !loading && <CheckCircle2 className="w-20 h-20 opacity-30" />}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={HeartPulse} label="Heart Rate"       value={latestHR ? `${latestHR} bpm` : null} color="border-red-400" />
          <StatCard icon={TrendingUp} label="Blood Pressure"   value={latestBP}                             color="border-blue-400" />
          <StatCard icon={CheckCircle2} label="Check-ins Today" value={checkIns}                           color="border-green-400" />
          <StatCard icon={Pill}       label="Meds Taken"       value={medsTotal > 0 ? `${medsTaken}/${medsTotal}` : '—'} color="border-purple-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Medication tracker */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-purple-700 px-5 py-4 flex items-center gap-2">
              <Pill className="w-6 h-6 text-purple-200" />
              <h2 className="text-xl font-bold text-white">Medication Tracker</h2>
            </div>
            {reminders.length === 0 ? (
              <p className="text-gray-400 text-center py-10">
                {loading ? 'Loading…' : 'No medications scheduled.'}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-bold text-gray-800">{r.medication_name}</p>
                      <p className="text-sm text-gray-500">{r.dosage} &bull; {r.time_of_day?.slice(0, 5)}</p>
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

          {/* Health log feed */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-blue-700 px-5 py-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-200" />
              <h2 className="text-xl font-bold text-white">Recent Health Logs</h2>
            </div>
            {healthLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-10">
                {loading ? 'Loading…' : 'No health logs yet.'}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {healthLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <StatusBadge status={log.status} />
                      {log.heart_rate && (
                        <p className="text-sm text-gray-500 mt-1">
                          HR: {log.heart_rate} bpm &bull; BP: {log.blood_pressure}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    a.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
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
