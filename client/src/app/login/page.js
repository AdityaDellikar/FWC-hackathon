'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { UserCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@hireflow.com', color: 'text-red-600 bg-red-50' },
  { role: 'Manager', email: 'manager@hireflow.com', color: 'text-blue-600 bg-blue-50' },
  { role: 'HR', email: 'hr@hireflow.com', color: 'text-green-600 bg-green-50' },
  { role: 'Employee', email: 'employee@hireflow.com', color: 'text-gray-600 bg-gray-50' },
];

const ROLE_DASHBOARDS = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  hr: '/dashboard/hr',
  employee: '/dashboard/employee',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // Poll for role then redirect
      let attempts = 0;
      const checkRole = setInterval(() => {
        attempts++;
        // After a brief wait, redirect to home which will handle role-based routing
        if (attempts >= 4) {
          clearInterval(checkRole);
          router.push('/');
        }
      }, 300);
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <UserCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HireFlow</h1>
          <p className="text-gray-500 mt-1 text-sm">AI-Powered HR Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎯</span>
            <p className="text-sm font-semibold text-gray-700">
              Demo Accounts{' '}
              <span className="font-normal text-gray-400">(password: demo1234)</span>
            </p>
          </div>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                onClick={() => fillDemo(acc.email)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/60 transition-all group"
              >
                <span className={`badge ${acc.color} font-semibold text-xs`}>{acc.role}</span>
                <span className="text-sm text-gray-500 group-hover:text-indigo-600 transition-colors font-mono">
                  {acc.email}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Click any account to auto-fill credentials
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          HireFlow HRMS &copy; {new Date().getFullYear()} — AI-Powered Workforce Management
        </p>
      </div>
    </div>
  );
}
