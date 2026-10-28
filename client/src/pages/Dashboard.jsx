import React, { useState, useEffect } from 'react';
import API from '../api';
import { Wallet, TrendingUp, AlertTriangle, PieChart, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/analytics/summary');
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400"></div>
      </div>
    );
  }

  const budgetUsedPercent = Math.min(
    100,
    Math.round(((summary?.totalSpent || 0) / (summary?.monthlyBudget || 1500)) * 100)
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Smart Budget Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Track monthly spending limits, canteen tabs, and remaining allowances.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs uppercase font-semibold">Monthly Limit</span>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">₹{summary?.monthlyBudget}</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs uppercase font-semibold">Total Spent</span>
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400">₹{summary?.totalSpent}</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs uppercase font-semibold">Remaining</span>
              {summary?.budgetExceeded ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <p className={`text-3xl font-black ${summary?.budgetExceeded ? 'text-red-400' : 'text-white'}`}>
              ₹{summary?.remainingBudget}
            </p>
          </div>

        </div>

        {/* Budget Progress Bar Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
              <PieChart className="w-5 h-5 text-emerald-400" /> Monthly Allowance Utilization
            </h3>
            <span className="text-sm font-bold text-emerald-400">{budgetUsedPercent}%</span>
          </div>

          {/* Bar */}
          <div className="w-full bg-zinc-950 rounded-full h-4 border border-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                budgetUsedPercent > 90
                  ? 'bg-red-500'
                  : budgetUsedPercent > 70
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${budgetUsedPercent}%` }}
            ></div>
          </div>

          {summary?.budgetExceeded && (
            <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4 h-4" /> Warning: You have exceeded your monthly budget target of ₹{summary?.monthlyBudget}!
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;