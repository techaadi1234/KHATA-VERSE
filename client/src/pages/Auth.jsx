import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, UserCheck, ShieldCheck, Wallet, Lock, Mail, User as UserIcon } from 'lucide-react';
import API from '../api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    monthlyBudget: 1500,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const vendorLoginOnly = role === 'vendor';
  const showRegister = !isLogin && !vendorLoginOnly;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setError('');
    if (nextRole === 'vendor') {
      setIsLogin(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'vendor' && !isLogin) {
      setError('Vendor accounts are issued by admin. Login only.');
      return;
    }

    const email = formData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email (e.g. name@college.edu)');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin || vendorLoginOnly ? '/auth/login' : '/auth/register';
      const payload =
        isLogin || vendorLoginOnly
          ? { email, password: formData.password, role }
          : { ...formData, email, role: 'student' };

      const { data } = await API.post(endpoint, payload);

      localStorage.setItem('khataverse_token', data.token);
      localStorage.setItem('khataverse_user', JSON.stringify(data));

      if (data.role === 'vendor') {
        navigate('/vendor-dashboard');
      } else {
        navigate('/room-hub');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col justify-center items-center px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-neonGreen/20 to-neonCyan/20 border border-neonGreen/30 mb-4 shadow-[0_0_30px_rgba(0,245,160,0.15)]">
          <Utensils className="w-8 h-8 text-neonGreen" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          KHATA<span className="text-neonGreen">VERSE</span>
        </h1>
        <p className="text-mutedText text-sm mt-1">Campus Canteen & Group Split Ledger</p>
      </div>

      <div className="w-full max-w-md bg-cardBg border border-cardBorder rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-2 bg-darkBg/60 p-1.5 rounded-2xl border border-cardBorder mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 ${
              role === 'student'
                ? 'bg-neonGreen text-darkBg shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                : 'text-mutedText hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" /> STUDENT
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('vendor')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 ${
              role === 'vendor'
                ? 'bg-neonCyan text-darkBg shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                : 'text-mutedText hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> BHAIYA (VENDOR)
          </button>
        </div>

        {vendorLoginOnly && (
          <p className="text-[11px] text-mutedText text-center mb-4">
            Enter Credentials To Login.
          </p>
        )}

        {error && (
          <div className="bg-neonCoral/10 border border-neonCoral/30 text-neonCoral text-xs font-semibold p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {showRegister && (
            <div>
              <label className="block text-xs font-semibold text-mutedText uppercase mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-mutedText" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Aditya Raj"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-darkBg border border-cardBorder text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-neonGreen transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-mutedText uppercase mb-1.5"> Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-mutedText" />
              <input
                type="email"
                name="email"
                required
                pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                title="Use a valid email like name@college.edu"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-darkBg border border-cardBorder text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-neonGreen transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-mutedText uppercase mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-mutedText" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-darkBg border border-cardBorder text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-neonGreen transition-all"
              />
            </div>
          </div>

          {showRegister && (
            <div>
              <label className="block text-xs font-semibold text-mutedText uppercase mb-1.5">Monthly Budget Target (₹)</label>
              <div className="relative">
                <Wallet className="absolute left-3.5 top-3 w-4 h-4 text-mutedText" />
                <input
                  type="number"
                  name="monthlyBudget"
                  value={formData.monthlyBudget}
                  onChange={handleChange}
                  className="w-full bg-darkBg border border-cardBorder text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-neonGreen transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-2 ${
              role === 'vendor'
                ? 'bg-neonCyan text-darkBg hover:bg-neonCyan/90 shadow-[0_0_20px_rgba(0,210,255,0.3)]'
                : 'bg-neonGreen text-darkBg hover:bg-neonGreen/90 shadow-[0_0_20px_rgba(0,245,160,0.3)]'
            }`}
          >
            {loading
              ? 'Authenticating...'
              : vendorLoginOnly || isLogin
                ? `LOGIN AS ${role.toUpperCase()}`
                : 'CREATE KHATAVERSE ACCOUNT'}
          </button>
        </form>

        {!vendorLoginOnly && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-mutedText hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? " : 'Already registered? '}
              <span className="text-neonGreen font-semibold underline ml-1">
                {isLogin ? 'Sign Up' : 'Log In'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
