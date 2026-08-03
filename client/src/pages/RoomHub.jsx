import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogOut, Copy, Check, ShoppingBag, ShieldAlert } from 'lucide-react';
import API from '../api';

const RoomHub = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form states for creating/joining room
  const [actionType, setActionType] = useState('join'); // 'join' or 'create'
  const [roomName, setRoomName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('khataverse_user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchMyRoom();
  }, [navigate]);

  const fetchMyRoom = async () => {
    try {
      const { data } = await API.get('/rooms/myroom');
      setRoom(data);
    } catch (err) {
      // User is not in a room yet (404 is expected here)
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/rooms/create', { roomName });
      setRoom(data);
      fetchMyRoom(); // Refresh populated room
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room.');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/rooms/join', { roomCode: roomCodeInput });
      setRoom(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room.');
    }
  };

  const copyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('khataverse_token');
    localStorage.removeItem('khataverse_user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center text-neonGreen font-mono text-sm">
        Initializing Khataverse Room Hub...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg px-4 py-6 max-w-lg mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-6 border-b border-cardBorder">
          <div>
            <h2 className="text-xl font-black text-white">
              KHATA<span className="text-neonGreen">VERSE</span>
            </h2>
            <p className="text-xs text-mutedText">Logged in as <span className="text-white font-medium">{user?.name}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-cardBg border border-cardBorder text-mutedText hover:text-neonCoral transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* CONDITION 1: USER IS NOT IN A ROOM YET */}
        {!room ? (
          <div className="mt-8 bg-cardBg border border-cardBorder rounded-3xl p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-neonGreen/10 text-neonGreen border border-neonGreen/20 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Join or Create Your Room Crew</h3>
              <p className="text-xs text-mutedText mt-1">Connect with up to 15 friends to split midnight canteen expenses.</p>
            </div>

            {/* Toggle Create / Join */}
            <div className="grid grid-cols-2 gap-2 bg-darkBg/60 p-1 rounded-xl border border-cardBorder mb-6">
              <button
                type="button"
                onClick={() => { setActionType('join'); setError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  actionType === 'join' ? 'bg-neonGreen text-darkBg' : 'text-mutedText'
                }`}
              >
                JOIN ROOM
              </button>
              <button
                type="button"
                onClick={() => { setActionType('create'); setError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  actionType === 'create' ? 'bg-neonGreen text-darkBg' : 'text-mutedText'
                }`}
              >
                CREATE ROOM
              </button>
            </div>

            {error && (
              <div className="bg-neonCoral/10 border border-neonCoral/30 text-neonCoral text-xs p-3 rounded-xl mb-4 text-center font-medium">
                {error}
              </div>
            )}

            {actionType === 'join' ? (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-mutedText uppercase mb-1.5">Enter 6-Digit Room Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KHT123"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    className="w-full bg-darkBg border border-cardBorder text-white text-center font-mono tracking-widest text-lg uppercase rounded-xl py-2.5 focus:outline-none focus:border-neonGreen"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-neonGreen text-darkBg font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,245,160,0.3)]"
                >
                  JOIN ROOM CREW
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-mutedText uppercase mb-1.5">Room / Hostel Wing Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block B - Room 204"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-darkBg border border-cardBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-neonGreen"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-neonGreen text-darkBg font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,245,160,0.3)]"
                >
                  CREATE NEW ROOM
                </button>
              </form>
            )}
          </div>
        ) : (
          /* CONDITION 2: ACTIVE ROOM VIEW */
          <div className="mt-6 space-y-6">
            {/* Room Info Banner */}
            <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-neonGreen uppercase bg-neonGreen/10 border border-neonGreen/20 px-2.5 py-1 rounded-full">
                    ACTIVE ROOM CREW
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">{room.roomName}</h3>
                </div>
                
                {/* Code Copy Chip */}
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 bg-darkBg border border-cardBorder px-3 py-1.5 rounded-xl text-xs font-mono text-neonCyan hover:border-neonCyan transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-neonGreen" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{room.roomCode}</span>
                </button>
              </div>

              {/* Member Capacity Progress */}
              <div className="flex justify-between items-center text-xs text-mutedText mb-1.5 font-medium">
                <span>Room Members</span>
                <span className="text-white font-bold">{room.members?.length} / 15</span>
              </div>
              <div className="w-full bg-darkBg h-2 rounded-full overflow-hidden border border-cardBorder">
                <div
                  className="bg-neonGreen h-full transition-all duration-300"
                  style={{ width: `${((room.members?.length || 0) / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Room Members Grid */}
            <div>
              <h4 className="text-xs font-bold text-mutedText uppercase tracking-wider mb-3">Roommates ({room.members?.length})</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {room.members?.map((member) => (
                  <div key={member._id} className="bg-cardBg/60 border border-cardBorder rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neonGreen/10 border border-neonGreen/20 text-neonGreen flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{member.name}</p>
                        <p className="text-[11px] text-mutedText">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-mutedText bg-darkBg px-2.5 py-1 rounded-lg border border-cardBorder">
                      Target: ₹{member.monthlyBudget || 1500}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Floating Action: Create Canteen Run */}
      {room && (
        <div className="pt-6">
          <button
            onClick={() => navigate('/canteen-run')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-neonGreen to-neonCyan text-darkBg font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,245,160,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <ShoppingBag className="w-5 h-5 fill-darkBg" /> START NIGHT CANTEEN RUN
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomHub;