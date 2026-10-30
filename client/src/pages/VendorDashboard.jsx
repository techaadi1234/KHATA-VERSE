import React, { useState, useEffect } from 'react';
import API from '../api';
import { PlusCircle, Utensils, Power, Trash2 } from 'lucide-react';

const VendorDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/menu');
      setMenuItems(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const { data } = await API.post('/menu', {
        itemName: name.trim(),
        price: Number(price),
        category,
      });
      setMenuItems((prev) => [...prev, data]);
      setName('');
      setPrice('');
      setCategory('Snacks');
      setSuccess(`Added "${data.itemName}" to the canteen menu`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    setActionId(id);
    setError('');
    try {
      const { data } = await API.patch(`/menu/${id}/toggle`);
      setMenuItems((prev) =>
        prev.map((item) => (item._id === id ? data.item : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update availability');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionId(id);
    setError('');
    try {
      await API.delete(`/menu/${id}`);
      setMenuItems((prev) => prev.filter((item) => item._id !== id));
      setSuccess('Item removed from menu');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete item');
    } finally {
      setActionId(null);
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
        <div className="border-b border-zinc-800 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Canteen Bhaiya Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Add items, set prices, and control what’s available for students.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Menu Item */}
          <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
              <PlusCircle className="w-5 h-5 text-emerald-400" /> Add Menu Item
            </h3>

            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samosa, Chai, Cold Coffee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="5"
                  placeholder="e.g. 20"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Meals">Meals</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold py-2.5 rounded-xl transition-all"
              >
                {submitting ? 'Adding...' : 'Add to Canteen Menu'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
              <Utensils className="w-5 h-5 text-emerald-400" /> Current Menu ({menuItems.length})
            </h3>

            {menuItems.length === 0 ? (
              <p className="text-zinc-500 text-sm py-8 text-center">
                No items yet. Add your first canteen item on the left.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {menuItems.map((item) => {
                  const busy = actionId === item._id;
                  return (
                    <div
                      key={item._id}
                      className={`bg-zinc-950 border p-3.5 rounded-xl flex items-center justify-between gap-3 ${
                        item.isAvailable !== false ? 'border-zinc-800' : 'border-zinc-800/60 opacity-60'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white truncate">
                          {item.itemName}
                        </p>
                        <span className="text-[10px] text-zinc-500 uppercase">
                          {item.category || 'General'}
                          {item.isAvailable === false && ' · Off'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-emerald-400">₹{item.price}</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleToggle(item._id)}
                          title={item.isAvailable !== false ? 'Mark unavailable' : 'Mark available'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.isAvailable !== false
                              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              : 'border-zinc-700 text-zinc-500 hover:bg-zinc-800'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(item._id)}
                          title="Remove item"
                          className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
