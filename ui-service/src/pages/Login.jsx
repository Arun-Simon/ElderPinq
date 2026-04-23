import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, LogIn, Eye, EyeOff } from 'lucide-react';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'elder') navigate('/elder');
      else navigate('/family');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl mb-4">
            <HeartPulse className="w-14 h-14 text-blue-700" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">ElderPing</h1>
          <p className="text-blue-200 mt-2 text-xl">Your Daily Care Companion</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Sign In</h2>

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-400 text-red-700 rounded-xl p-4 text-lg font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-gray-800 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-gray-800 focus:outline-none focus:border-blue-600 transition-colors pr-16"
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

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-2xl font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg"
            >
              {loading ? (
                <span className="animate-spin inline-block w-6 h-6 border-4 border-white border-t-transparent rounded-full" />
              ) : (
                <LogIn className="w-7 h-7" />
              )}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-base mt-6">
            Redirects to <strong>Elder</strong> or <strong>Family</strong> view based on your role.
          </p>
        </div>
      </div>
    </div>
  );
}
