import React, { useState, useEffect } from 'react';
import API from '../api';
import { Utensils, ShoppingBag, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';

const Canteen = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cart state structured per user: { [userId]: { [itemId]: { menuItem, itemName, qty, price } } }
  const [cart, setCart] = useState({});
  const [selectedUser, setSelectedUser] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [menuRes, roomRes] = await Promise.all([
        API.get('/menu'),
        API.get('/rooms/myroom')
      ]);

      setMenuItems(menuRes.data || []);
      
      if (roomRes.data && roomRes.data.members) {
        setRoomMembers(roomRes.data.members);
        setSelectedUser(roomRes.data.members[0]?._id || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load canteen data.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (item, delta) => {
    if (!selectedUser) return;

    setCart((prevCart) => {
      const userCart = prevCart[selectedUser] || {};
      const currentQty = userCart[item._id]?.qty || 0;
      const newQty = currentQty + delta;

      const updatedUserCart = { ...userCart };

      if (newQty <= 0) {
        delete updatedUserCart[item._id];
      } else {
        updatedUserCart[item._id] = {
          menuItem: item._id,
          itemName: item.name || item.itemName || 'Food Item',
          qty: newQty,
          price: item.price,
        };
      }

      return { ...prevCart, [selectedUser]: updatedUserCart };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(cart).forEach((userItems) => {
      Object.values(userItems).forEach((item) => {
        total += item.price * item.qty;
      });
    });
    return total;
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Transform cart into your backend's memberOrders format:
    // memberOrders = [{ user: UserId, items: [{ menuItem, itemName, qty, price }] }]
    const memberOrders = Object.entries(cart)
      .map(([userId, itemsObj]) => ({
        user: userId,
        items: Object.values(itemsObj),
      }))
      .filter((order) => order.items.length > 0);

    if (memberOrders.length === 0) {
      setError('Please select items for at least one room member.');
      setSubmitting(false);
      return;
    }

    try {
      await API.post('/transactions', { memberOrders });
      setSuccess('Canteen order recorded successfully to room ledger!');
      setCart({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place canteen order.');
    } finally {
      setSubmitting(false);
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Campus Canteen
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Select canteen items, assign orders to roomies, and split the bill.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        {/* Ordering Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Menu Items Grid */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Roommate Selector Bar */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Ordering For:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-emerald-400 font-semibold rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                {roomMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Food Menu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const userCart = cart[selectedUser] || {};
                const currentQty = userCart[item._id]?.qty || 0;

                return (
                  <div
                    key={item._id}
                    className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-white">{item.name || item.itemName}</h4>
                        <span className="text-emerald-400 font-bold text-sm">₹{item.price}</span>
                      </div>
                      {item.category && (
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-1.5">
                      <button
                        onClick={() => updateQuantity(item, -1)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm text-white px-3">{currentQty}</span>
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart & Summary Panel */}
          <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-zinc-800 pb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" /> Order Summary
              </h3>

              {Object.keys(cart).length === 0 ? (
                <p className="text-zinc-500 text-xs py-6 text-center">Cart is empty. Select items above for your roommates.</p>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {Object.entries(cart).map(([userId, userItems]) => {
                    const memberName = roomMembers.find((m) => m._id === userId)?.name || 'Roommate';
                    const itemsList = Object.values(userItems);

                    if (itemsList.length === 0) return null;

                    return (
                      <div key={userId} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-emerald-400 border-b border-zinc-900 pb-1">{memberName}</p>
                        {itemsList.map((it) => (
                          <div key={it.menuItem} className="flex justify-between text-xs text-zinc-300">
                            <span>{it.itemName} x {it.qty}</span>
                            <span className="font-semibold text-white">₹{it.price * it.qty}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total and Checkout */}
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-zinc-300">Total Order Amount:</span>
                <span className="text-emerald-400 text-xl">₹{calculateTotal()}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || calculateTotal() === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Recording...' : <>Confirm & Split Order <Send className="w-4 h-4" /></>}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Canteen;