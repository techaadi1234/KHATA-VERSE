import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Copy,
  Check,
  ShoppingBag,
  Receipt,
  ArrowRightLeft,
  ShieldCheck,
  UserCheck,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import API from '../api';

const RoomHub = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Form states for creating / joining
  const [actionType, setActionType] = useState('join'); // 'join' or 'create'
  const [roomName, setRoomName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('khataverse_user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchAllRoomData();

    const handleRoomChanged = () => {
      fetchAllRoomData();
    };
    window.addEventListener('roomChanged', handleRoomChanged);
    return () => window.removeEventListener('roomChanged', handleRoomChanged);
  }, [navigate]);

  const fetchAllRoomData = async () => {
    try {
      setLoading(true);
      const [myRoomsRes, myRoomRes] = await Promise.all([
        API.get('/rooms/myrooms').catch(() => ({ data: { rooms: [], activeRoomId: null } })),
        API.get('/rooms/myroom').catch(() => ({ data: null })),
      ]);

      setRooms(myRoomsRes.data?.rooms || []);
      setActiveRoom(myRoomRes.data || null);
    } catch {
      setActiveRoom(null);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRoom = async (roomId) => {
    try {
      const { data } = await API.post(`/rooms/switch/${roomId}`);
      setActiveRoom(data.activeRoom);
      fetchAllRoomData();
      window.dispatchEvent(new Event('roomChanged'));
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to switch room.');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!roomName.trim()) return;

    try {
      setSubmitting(true);
      const { data } = await API.post('/rooms/create', { roomName: roomName.trim() });
      setRoomName('');
      setFormSuccess(`Room "${data.roomName}" created and set as active!`);
      fetchAllRoomData();
      window.dispatchEvent(new Event('roomChanged'));
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!roomCodeInput.trim()) return;

    try {
      setSubmitting(true);
      const { data } = await API.post('/rooms/join', { roomCode: roomCodeInput.trim() });
      setRoomCodeInput('');
      setFormSuccess(`Joined "${data.roomName}" successfully!`);
      fetchAllRoomData();
      window.dispatchEvent(new Event('roomChanged'));
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to join room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveRoom = async (roomId, name) => {
    if (!window.confirm(`Are you sure you want to leave "${name}"?`)) return;

    try {
      await API.post(`/rooms/leave/${roomId}`);
      fetchAllRoomData();
      window.dispatchEvent(new Event('roomChanged'));
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to leave room.');
    }
  };

  const copyCode = (code, id) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Room Hub
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Manage all your room groups, switch active context, and split canteen tabs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
              {rooms.length} {rooms.length === 1 ? 'Room Joined' : 'Rooms Joined'}
            </span>
          </div>
        </div>

        {/* Global Notifications */}
        {formSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {formSuccess}
          </div>
        )}
        {formError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {formError}
          </div>
        )}

        {/* 1. CURRENTLY ACTIVE ROOM HERO CARD */}
        {activeRoom ? (
          <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    ACTIVE ROOM CONTEXT
                  </span>
                  <span className="text-xs text-zinc-400">
                    Canteen & Ledger use this room
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{activeRoom.roomName}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Created by {activeRoom.admin?.name || 'Admin'}
                </p>
              </div>

              {/* Room Code Badge */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyCode(activeRoom.roomCode, 'active')}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-400 hover:border-emerald-400 transition-all cursor-pointer shadow-sm"
                  title="Click to copy Room Code"
                >
                  {copiedId === 'active' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      <span>Code: {activeRoom.roomCode}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Capacity Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
                <span>Room Capacity</span>
                <span className="text-white font-bold font-mono">
                  {activeRoom.members?.length || 0} / 15 Roommates
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((activeRoom.members?.length || 0) / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Room Members */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> Roommates in this group ({activeRoom.members?.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeRoom.members?.map((member) => (
                  <div
                    key={member._id}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                      ₹{member.monthlyBudget || 1500}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions for Active Room */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/canteen')}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                <ShoppingBag className="w-4 h-4" /> Start Canteen Run in this Room
              </button>
              <button
                type="button"
                onClick={() => navigate('/ledger')}
                className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-emerald-400" /> View Room Ledger
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
            <Users className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Active Room Selected</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              You are not currently part of any active room. Join an existing room with a 6-digit code or create a brand new one below!
            </p>
          </div>
        )}

        {/* 2. ALL JOINED ROOMS LIST */}
        {rooms.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" /> All Your Room Crews ({rooms.length})
              </h3>
              <span className="text-xs text-zinc-500">
                Click any room to switch context
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((rm) => {
                const isActive = activeRoom && String(activeRoom._id) === String(rm._id);
                const isAdmin = user && String(rm.admin?._id || rm.admin) === String(user._id);

                return (
                  <div
                    key={rm._id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isActive
                        ? 'bg-emerald-500/5 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-white">{rm.roomName}</h4>
                          {isAdmin ? (
                            <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> Member
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {rm.members?.length || 0} Roommates
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyCode(rm.roomCode, rm._id)}
                        className="text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-lg text-emerald-400 flex items-center gap-1 transition-all"
                        title="Copy Room Code"
                      >
                        {copiedId === rm._id ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-500" /> {rm.roomCode}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                      {isActive ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Currently Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchRoom(rm._id)}
                          className="text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          Switch to this Room
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleLeaveRoom(rm._id, rm.roomName)}
                        className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 p-1 transition-colors"
                        title="Leave Room"
                      >
                        <DoorOpen className="w-3.5 h-3.5" /> Leave
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. CREATE OR JOIN ANOTHER ROOM SECTION */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              {rooms.length > 0 ? 'Create or Join Another Room' : 'Get Started with a Room'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              You can belong to multiple groups at the same time (e.g. Hostel Wing, Project Crew, Canteen Club).
            </p>
          </div>

          {/* Toggle Join / Create Tab */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800 max-w-sm">
            <button
              type="button"
              onClick={() => {
                setActionType('join');
                setFormError('');
                setFormSuccess('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                actionType === 'join'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              JOIN WITH CODE
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('create');
                setFormError('');
                setFormSuccess('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                actionType === 'create'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              CREATE NEW ROOM
            </button>
          </div>

          {/* Forms */}
          {actionType === 'join' ? (
            <form onSubmit={handleJoinRoom} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  Enter 6-Digit Room Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KHT123"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-center font-mono tracking-widest text-lg uppercase rounded-xl py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !roomCodeInput.trim()}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {submitting ? 'Joining...' : 'Join Room Crew'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  Room / Crew Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block B - Room 204 or Canteen Gang"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !roomName.trim()}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {submitting ? 'Creating...' : 'Create New Room'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomHub;