import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Pill, HeartPulse, LogOut, Clock, User, Smile } from 'lucide-react';
import { getCachedUser, logout } from '../api/authApi';
import { checkIn } from '../api/healthApi';
import { getReminders, markTaken } from '../api/reminderApi';

export default function ElderDashboard() {
  const navigate = useNavigate();
  const user = getCachedUser();

  const [reminders, setReminders]         = useState([]);
  const [checkedIn, setCheckedIn]         = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [medLoading, setMedLoading]       = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType]       = useState('success');
  const [time, setTime]                   = useState(new Date());
  const [remindersError, setRemindersError] = useState('');

  // Redirect if not logged in or wrong role
  useEffect(() => {
    if (!user || user.role !== 'elder') {
      navigate('/login', { replace: true });
    }
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load reminders on mount
  useEffect(() => {
    if (!user?.id) return;
    getReminders(user.id)
      .then(setReminders)
      .catch((err) => setRemindersError(err.message));
  }, [user?.id]);

  const showStatus = (msg, type = 'success') => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      await checkIn(user.id, 'feeling_well');
      setCheckedIn(true);
      showStatus('✅ Check-in recorded! Your family has been notified.', 'success');
    } catch (err) {
      showStatus(`⚠️ ${err.message}`, 'error');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleMedTaken = async (reminder) => {
    setMedLoading(reminder.id);
    try {
      await markTaken(reminder.id);
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, taken: true } : r))
      );
      showStatus(`💊 "${reminder.medication_name}" marked as taken!`, 'success');
    } catch (err) {
      showStatus(`⚠️ ${err.message}`, 'error');
    } finally {
      setMedLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-blue-800 text-white px-6 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-9 h-9 text-blue-300" />
          <span className="text-3xl font-extrabold tracking-tight">ElderPing</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold">{timeStr}</p>
            <p className="text-blue-300 text-base">{dateStr}</p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-xl text-lg font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6 flex items-center gap-4 border-l-8 border-blue-600">
          <div className="bg-blue-100 rounded-full p-4">
            <User className="w-10 h-10 text-blue-700" />
          </div>
          <div>
            <p className="text-gray-500 text-lg">Good day,</p>
            <h1 className="text-4xl font-extrabold text-gray-900">{user?.username || 'Friend'}</h1>
          </div>
        </div>

        {/* Status Banner */}
        {statusMessage && (
          <div className={`mb-6 rounded-2xl p-5 text-xl font-semibold text-center ${
            statusType === 'success'
              ? 'bg-green-100 text-green-800 border-2 border-green-400'
              : 'bg-red-100 text-red-800 border-2 border-red-400'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* BIG Check-In Button */}
        <div className="mb-8">
          <button
            id="checkin-btn"
            onClick={handleCheckIn}
            disabled={checkedIn || checkInLoading}
            className={`w-full py-10 rounded-3xl flex flex-col items-center justify-center gap-4 shadow-xl text-white text-3xl font-extrabold transition-all active:scale-95 ${
              checkedIn
                ? 'bg-green-500 cursor-default'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {checkInLoading ? (
              <span className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle2 className="w-16 h-16" strokeWidth={1.5} />
            )}
            {checkedIn ? 'Checked In! ✓' : checkInLoading ? 'Sending…' : "I'm Doing Well"}
            <span className="text-lg font-normal opacity-80">
              {checkedIn
                ? 'Your family knows you are safe.'
                : 'Tap to let your family know'}
            </span>
          </button>
        </div>

        {/* Medications */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="bg-indigo-700 px-6 py-5 flex items-center gap-3">
            <Pill className="w-8 h-8 text-indigo-200" />
            <h2 className="text-2xl font-extrabold text-white">Today's Medications</h2>
          </div>

          {remindersError ? (
            <p className="text-center text-red-500 py-8 text-lg">{remindersError}</p>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
              <Smile className="w-14 h-14" />
              <p className="text-xl">No medications scheduled.</p>
            </div>
          ) : (
            <ul className="divide-y-2 divide-gray-100">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-6 py-5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${r.taken ? 'bg-green-100' : 'bg-indigo-100'}`}>
                      <Pill className={`w-7 h-7 ${r.taken ? 'text-green-600' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{r.medication_name}</p>
                      <p className="text-gray-500 text-lg">{r.dosage} &bull; {r.time_of_day?.slice(0, 5)}</p>
                    </div>
                  </div>
                  <button
                    id={`med-taken-${r.id}`}
                    onClick={() => !r.taken && handleMedTaken(r)}
                    disabled={r.taken || medLoading === r.id}
                    className={`px-6 py-3 rounded-2xl text-xl font-bold transition-all active:scale-95 whitespace-nowrap ${
                      r.taken
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-md'
                    }`}
                  >
                    {medLoading === r.id ? '…' : r.taken ? '✓ Taken' : 'Mark Taken'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 text-gray-500 justify-center">
          <Clock className="w-5 h-5" />
          <span className="text-base">Last updated: {timeStr}</span>
        </div>
      </main>
    </div>
  );
}
