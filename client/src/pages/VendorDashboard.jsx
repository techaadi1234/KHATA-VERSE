import React, { useState, useEffect } from 'react';
import API from '../api';
import { PlusCircle, Utensils, Receipt, Check } from 'lucide-react';

const VendorDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Menu Item Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [menuRes, salesRes] = await Promise.all([
        API.get('/menu'),
        API.get('/transactions/vendor-summary')
      ]);
      setMenuItems(menuRes.data || []);
      setSales(salesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await API.post('/menu', { name, price: Number(price), category });
      setMenuItems((prev) => [...prev, data]);
      setName('');
      setPrice('');
    } catch (err) {
      console.error(err);
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
        
        <div className="border-b border-zinc-800 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Canteen Bhaiya Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Manage canteen items, prices, and view student tab logs.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Menu Item */}
          <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
              <PlusCircle className="w-5 h-5 text-emerald-400" /> Add Menu Item
            </h3>

            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Item Name</label>
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
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 20"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Category</label>
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
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-xl transition-all"
              >
                {submitting ? 'Adding...' : 'Add to Canteen Menu'}
              </button>
            </form>
          </div>

          {/* Current Live Menu */}
          <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
              <Utensils className="w-5 h-5 text-emerald-400" /> Current Menu ({menuItems.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {menuItems.map((item) => (
                <div key={item._id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-white">{item.name || item.itemName}</p>
                    <span className="text-[10px] text-zinc-500 uppercase">{item.category || 'General'}</span>
                  </div>
                  <span className="font-bold text-emerald-400">₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default VendorDashboard;