import React, { useState, useEffect } from 'react';
import API from '../api';
import { ShoppingBag, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';

const isMenuAvailable = (item) => item?.isAvailable !== false;

const Canteen = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [soldOutNotice, setSoldOutNotice] = useState('');

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
        API.get('/rooms/myroom'),
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

    if (!isMenuAvailable(item) && delta > 0) {
      setSoldOutNotice(
        `${item.itemName || item.name || 'This item'} ran out at night canteen`
      );
      return;
    }

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

  const activeOrders = Object.entries(cart)
    .map(([userId, userItems]) => {
      const member = roomMembers.find((m) => m._id === userId);
      const itemsList = Object.values(userItems || {});
      const memberTotal = itemsList.reduce((sum, it) => sum + it.price * it.qty, 0);
      return {
        userId,
        memberName: member?.name || 'Roommate',
        itemsList,
        memberTotal,
      };
    })
    .filter((entry) => entry.itemsList.length > 0);

  const totalItemsCount = activeOrders.reduce(
    (count, entry) =>
      count + entry.itemsList.reduce((sub, it) => sub + it.qty, 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
      {soldOutNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <p className="text-amber-400 font-bold text-lg">Item ran out at night canteen</p>
            <p className="text-zinc-400 text-sm">{soldOutNotice}</p>
            <button
              type="button"
              onClick={() => setSoldOutNotice('')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-zinc-800 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Campus Canteen
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Select canteen items, assign orders to roomies, and split the bill.
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Ordering For:
              </span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-emerald-400 font-semibold rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {roomMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const userCart = cart[selectedUser] || {};
                const currentQty = userCart[item._id]?.qty || 0;
                const unavailable = !isMenuAvailable(item);

                return (
                  <div
                    key={item._id}
                    className={`bg-zinc-900/60 border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all ${
                      unavailable
                        ? 'border-zinc-800/50 opacity-40 grayscale'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-white">{item.name || item.itemName}</h4>
                        <span className="text-emerald-400 font-bold text-sm">₹{item.price}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        {item.category || 'General'}
                        {unavailable ? ' · Ran out' : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-1.5">
                      <button
                        type="button"
                        disabled={unavailable || currentQty === 0}
                        onClick={() => updateQuantity(item, -1)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm text-white px-3">
                        {unavailable ? 'Off' : currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, 1)}
                        className={`p-1.5 rounded-lg transition-all ${
                          unavailable
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-6 bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl h-fit">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Order Summary</h3>
                  <p className="text-xs text-zinc-400">
                    {activeOrders.length === 0
                      ? 'No items selected'
                      : `${activeOrders.length} ${activeOrders.length === 1 ? 'roommate' : 'roommates'} ordering`}
                  </p>
                </div>
              </div>
              {totalItemsCount > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>

            {activeOrders.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 space-y-2">
                <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-400 text-sm font-medium">Cart is empty</p>
                <p className="text-zinc-600 text-xs">
                  Select menu items on the left to assign them to your roommates.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[min(65vh,540px)] overflow-y-auto pr-1">
                {activeOrders.map((entry) => (
                  <div
                    key={entry.userId}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5 shadow-sm hover:border-zinc-700/80 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold uppercase">
                          {entry.memberName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-emerald-400 tracking-wide">
                          {entry.memberName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                        ₹{entry.memberTotal}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {entry.itemsList.map((it) => (
                        <div
                          key={it.menuItem}
                          className="flex justify-between items-center text-xs text-zinc-300 py-0.5"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-white font-medium">{it.itemName}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">×{it.qty}</span>
                          </span>
                          <span className="font-semibold text-white font-mono">
                            ₹{it.price * it.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3.5 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Room split</span>
                <span className="text-zinc-300 font-medium">
                  {activeOrders.length > 0 ? `Shared between ${activeOrders.length} roomies` : '—'}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-zinc-300">Total Order Amount</span>
                <span className="text-emerald-400 text-2xl font-black font-mono">
                  ₹{calculateTotal()}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || calculateTotal() === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 text-sm"
              >
                {submitting ? (
                  'Recording...'
                ) : (
                  <>
                    Confirm & Split Order <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canteen;
