import { useState } from 'react';
import { Mountain, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email.trim().toLowerCase() === 'trekpremi@gmail.com' && password === 'Admin@123') {
        if (rememberMe) {
          localStorage.setItem('adminLoggedIn', 'true');
        } else {
          sessionStorage.setItem('adminLoggedIn', 'true');
        }
        onLogin();
      } else {
        setError('Invalid admin credentials. Please verify your email and password.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 font-sans">
      {/* Background Glows & Image */}
      <div className="absolute inset-0 z-0 opacity-40">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000" 
          alt="Mountains Background" 
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
      </div>

      {/* Floating Purple & Yellow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-white"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-white p-3 rounded-2xl flex items-center justify-center mb-4 max-w-[200px] border border-white/20 shadow-md">
            <img src="/nexttour.jpeg" alt="NextTour" className="h-7 w-auto object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            Admin Portal
          </h1>
          <p className="text-sm text-gray-300 font-medium">
            Sign in to manage treks, bookings & batches
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs sm:text-sm font-medium backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trekpremi@gmail.com"
                className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/15 rounded-2xl text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-black/40 border border-white/15 rounded-2xl text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#00C9B7] focus:ring-[#00C9B7] focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-300">Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#00C9B7] hover:bg-[#00B5A5] text-white font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-[#00C9B7]/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Credentials...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400">
            Protected Admin System • NextTour Admin © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
