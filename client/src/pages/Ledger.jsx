import React, { useState, useEffect } from 'react';
import API from '../api';
import { Receipt, ArrowUpRight, ArrowDownLeft, Users, Utensils } from 'lucide-react';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/transactions/room');
      setTransactions(data);
      calculateBalances(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ledger history.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = (txList) => {
    const memberMap = {};

    txList.forEach((tx) => {
      const payerId = tx.payer?._id || tx.payer;
      const payerName = tx.payer?.name || 'Roommate';

      if (!memberMap[payerId]) {
        memberMap[payerId] = { id: payerId, name: payerName, netBalance: 0 };
      }

      // Payer spent the total amount
      memberMap[payerId].netBalance += tx.totalAmount;

      // Each member owes their subTotal
      tx.memberOrders?.forEach((order) => {
        const memberId = order.user?._id || order.user;
        const memberName = order.user?.name || 'Roommate';

        if (!memberMap[memberId]) {
          memberMap[memberId] = { id: memberId, name: memberName, netBalance: 0 };
        }

        memberMap[memberId].netBalance -= order.subTotal;
      });
    });

    setBalances(Object.values(memberMap));
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
        <div className="border-b border-zinc-800 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Khata Ledger
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Room history, itemized canteen splits, and net balances.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Room Net Balances */}
        <div className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
            <Users className="w-5 h-5 text-emerald-400" /> Roommate Net Balances
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {balances.map((member) => {
              const isPositive = member.netBalance >= 0;
              return (
                <div
                  key={member.id}
                  className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm text-white">{member.name}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold flex items-center justify-end gap-1 ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      ₹{Math.abs(member.netBalance).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      {isPositive ? 'Gets Back' : 'Owes'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions History */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
            <Receipt className="w-5 h-5 text-emerald-400" /> Canteen Orders & Splits
          </h3>

          {transactions.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No transactions recorded yet for this room.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div>
                      <p className="text-xs text-zinc-400">
                        Paid by <span className="text-emerald-400 font-semibold">{tx.payer?.name || 'Roommate'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-white">₹{tx.totalAmount}</span>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Order Details per Member */}
                  <div className="space-y-2">
                    {tx.memberOrders?.map((order, idx) => (
                      <div key={idx} className="bg-zinc-900/50 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-zinc-200">{order.user?.name}: </span>
                          <span className="text-zinc-400">
                            {order.items?.map((it) => `${it.itemName} (x${it.qty})`).join(', ')}
                          </span>
                        </div>
                        <span className="font-semibold text-emerald-400">₹{order.subTotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Ledger;