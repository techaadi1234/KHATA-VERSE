import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Receipt, Utensils, LayoutDashboard, LogOut, User, Store } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('khataverse_user') || '{}');
  const isVendor = user.role === 'vendor';

  const handleLogout = () => {
    localStorage.removeItem('khataverse_token');
    localStorage.removeItem('khataverse_user');
    navigate('/');
  };

  const studentNav = [
    { name: 'Room Hub', path: '/room-hub', icon: Home },
    { name: 'Khata Ledger', path: '/ledger', icon: Receipt },
    { name: 'Canteen', path: '/canteen', icon: Utensils },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const vendorNav = [
    { name: 'Vendor Desk', path: '/vendor-dashboard', icon: Store },
  ];

  const navItems = isVendor ? vendorNav : studentNav;
  const homePath = isVendor ? '/vendor-dashboard' : '/room-hub';

  return (
    <nav className="bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to={homePath} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-emerald-500/20">
            Ψ
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">
            KHATA<span className="text-emerald-400">VERSE</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <User className={`w-3.5 h-3.5 ${isVendor ? 'text-cyan-400' : 'text-emerald-400'}`} />
            <span className="text-xs font-medium text-zinc-300">{user.name || 'User'}</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                isVendor ? 'bg-cyan-500/15 text-cyan-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {isVendor ? 'Vendor' : 'Student'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 text-zinc-400 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
