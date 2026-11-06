import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Receipt,
  Utensils,
  LayoutDashboard,
  LogOut,
  User,
  Store,
  ChevronDown,
  Check,
  Plus,
  Users,
} from 'lucide-react';
import API from '../api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('khataverse_user') || '{}');
  const isVendor = user.role === 'vendor';

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isVendor) {
      fetchRooms();
    }

    const handleRoomChanged = () => {
      fetchRooms();
    };

    window.addEventListener('roomChanged', handleRoomChanged);
    return () => {
      window.removeEventListener('roomChanged', handleRoomChanged);
    };
  }, [isVendor]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await API.get('/rooms/myrooms');
      setRooms(data.rooms || []);
      setActiveRoomId(data.activeRoomId || null);
    } catch {
      // Room fetch failed or user not logged in
    }
  };

  const handleSwitchRoom = async (roomId) => {
    if (roomId === activeRoomId || switching) return;
    try {
      setSwitching(true);
      await API.post(`/rooms/switch/${roomId}`);
      setActiveRoomId(roomId);
      setDropdownOpen(false);
      // Notify other pages (Canteen, Ledger, Dashboard, RoomHub) to refresh data
      window.dispatchEvent(new Event('roomChanged'));
    } catch {
      // Switch failed
    } finally {
      setSwitching(false);
    }
  };

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

  const activeRoom = rooms.find((r) => String(r._id) === String(activeRoomId));

  return (
    <nav className="bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to={homePath} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-emerald-500/20">
            Ψ
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white hidden xs:inline">
            KHATA<span className="text-emerald-400">VERSE</span>
          </span>
        </Link>

        {/* Room Switcher Pill (Students Only) */}
        {!isVendor && (
          <div className="relative" ref={dropdownRef}>
            {rooms.length > 0 ? (
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[110px] sm:max-w-[160px] truncate">
                  {activeRoom?.roomName || 'Select Room'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <Link
                to="/room-hub"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Join / Create Room</span>
                <span className="sm:hidden">Room</span>
              </Link>
            )}

            {/* Room Switcher Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900 flex justify-between items-center">
                  <span>Your Rooms</span>
                  <span className="text-zinc-400 font-mono">{rooms.length} Total</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 py-1 pr-0.5">
                  {rooms.map((rm) => {
                    const isActive = String(rm._id) === String(activeRoomId);
                    return (
                      <button
                        key={rm._id}
                        type="button"
                        onClick={() => handleSwitchRoom(rm._id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                          isActive
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate">{rm.roomName}</p>
                          <p className="text-[10px] text-zinc-500 font-normal flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3" />
                            {rm.members?.length || 0} members · Code: {rm.roomCode}
                          </p>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-900 pt-1">
                  <Link
                    to="/room-hub"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create or Join New Room</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center Nav Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right User & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <User className={`w-3.5 h-3.5 ${isVendor ? 'text-cyan-400' : 'text-emerald-400'}`} />
            <span className="text-xs font-medium text-zinc-300 max-w-[120px] truncate">
              {user.name || 'User'}
            </span>
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
            className="p-2 bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 text-zinc-400 rounded-xl transition-all cursor-pointer"
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
