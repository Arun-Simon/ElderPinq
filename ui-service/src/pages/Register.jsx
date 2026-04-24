import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { register } from '../api/authApi';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('family');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register({ username, password, role });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl mb-4">
            <HeartPulse className="w-14 h-14 text-indigo-700" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">ElderPing</h1>
          <p className="text-indigo-200 mt-2 text-xl">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Register</h2>

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-400 text-red-700 rounded-xl p-4 text-lg font-medium text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-400 text-green-700 rounded-xl p-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2" htmlFor="reg-username">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-gray-800 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  required
                  minLength={6}
                  className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-gray-800 focus:outline-none focus:border-indigo-600 transition-colors pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-3">I am a…</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'elder',  label: '👴 Elder',  desc: 'Check-in & meds' },
                  { value: 'family', label: '👨‍👩‍👧 Family', desc: 'Monitor loved one' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    id={`role-${opt.value}`}
                    onClick={() => setRole(opt.value)}
                    className={`rounded-2xl border-4 p-4 text-left transition-all ${
                      role === opt.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <p className="text-xl font-bold text-gray-800">{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white text-2xl font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg"
            >
              {loading ? (
                <span className="animate-spin inline-block w-6 h-6 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <UserPlus className="w-7 h-7" />
              )}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-lg mt-8">
            Already have an account?{' '}
            <Link id="go-to-login" to="/login" className="text-indigo-700 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
