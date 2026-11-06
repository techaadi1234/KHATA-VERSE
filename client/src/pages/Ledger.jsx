import React, { useState, useEffect } from 'react';
import API from '../api';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  ArrowRight,
  CheckCircle2,
  Coins,
} from 'lucide-react';

const Ledger = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('khataverse_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        // ignore parse error
      }
    }
    fetchLedger();

    const handleRoomChanged = () => {
      fetchLedger();
    };
    window.addEventListener('roomChanged', handleRoomChanged);
    return () => window.removeEventListener('roomChanged', handleRoomChanged);
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const [txRes, roomRes] = await Promise.all([
        API.get('/transactions/room'),
        API.get('/rooms/myroom').catch(() => ({ data: null })),
      ]);

      const txList = txRes.data || [];
      const roomMembers = roomRes.data?.members || [];

      setTransactions(txList);
      calculateBalancesAndSettlements(txList, roomMembers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ledger history.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBalancesAndSettlements = (txList, roomMembers) => {
    const memberMap = {};

    // 1. Initialize all room members so zero-balance members are also tracked
    roomMembers.forEach((member) => {
      const id = String(member._id);
      memberMap[id] = {
        id,
        name: member.name || 'Roommate',
        netBalance: 0,
      };
    });

    // 2. Accumulate net balances from all transactions
    txList.forEach((tx) => {
      const payerId = String(tx.payer?._id || tx.payer);
      const payerName = tx.payer?.name || 'Roommate';

      if (!memberMap[payerId]) {
        memberMap[payerId] = { id: payerId, name: payerName, netBalance: 0 };
      }

      // Payer gets credited the full amount paid
      memberMap[payerId].netBalance += tx.totalAmount;

      // Each member ordering gets debited their subTotal
      tx.memberOrders?.forEach((order) => {
        const memberId = String(order.user?._id || order.user);
        const memberName = order.user?.name || 'Roommate';

        if (!memberMap[memberId]) {
          memberMap[memberId] = { id: memberId, name: memberName, netBalance: 0 };
        }

        memberMap[memberId].netBalance -= order.subTotal;
      });
    });

    const balanceList = Object.values(memberMap);
    setBalances(balanceList);

    // 3. Calculate exact "Who Owes Whom" pairwise settlements using greedy debt resolution
    const debtors = [];
    const creditors = [];

    balanceList.forEach((m) => {
      const net = Math.round(m.netBalance * 100) / 100;
      if (net < -0.01) {
        debtors.push({ id: m.id, name: m.name, amount: Math.abs(net) });
      } else if (net > 0.01) {
        creditors.push({ id: m.id, name: m.name, amount: net });
      }
    });

    // Sort descending by amount to minimize total number of payments
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const calculatedSettlements = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const settleAmt = Math.min(debtor.amount, creditor.amount);

      if (settleAmt >= 0.01) {
        calculatedSettlements.push({
          fromId: debtor.id,
          fromName: debtor.name,
          toId: creditor.id,
          toName: creditor.name,
          amount: Math.round(settleAmt * 100) / 100,
        });
      }

      debtor.amount = Math.round((debtor.amount - settleAmt) * 100) / 100;
      creditor.amount = Math.round((creditor.amount - settleAmt) * 100) / 100;

      if (debtor.amount < 0.01) d++;
      if (creditor.amount < 0.01) c++;
    }

    setSettlements(calculatedSettlements);
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
          <p className="text-zinc-400 text-sm mt-1">
            Exact settlement plan, roommate net balances, and itemized canteen history.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* PRIMARY FEATURE: Who Owes Whom (Settlement Plan) */}
        <div className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Who Owes Whom
                </h3>
                <p className="text-xs text-zinc-400">
                  Exact payments required to settle all room tabs completely
                </p>
              </div>
            </div>

            {settlements.length > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold self-start sm:self-auto">
                {settlements.length} {settlements.length === 1 ? 'Settlement' : 'Settlements'} Pending
              </span>
            )}
          </div>

          {settlements.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">All Settled Up!</p>
              <p className="text-xs text-zinc-400">
                Nobody in this room owes anyone. All roommate balances are clear.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {settlements.map((s, idx) => {
                const isDebtor = currentUser && String(currentUser._id) === String(s.fromId);
                const isCreditor = currentUser && String(currentUser._id) === String(s.toId);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isDebtor
                        ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
                        : isCreditor
                        ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Header line stating the debt clearly */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-zinc-400">
                        {isDebtor ? (
                          <span className="text-rose-400 font-bold">You need to pay</span>
                        ) : isCreditor ? (
                          <span className="text-emerald-400 font-bold">You are owed by</span>
                        ) : (
                          'Settlement'
                        )}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                          isDebtor
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : isCreditor
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {isDebtor ? 'You Owe' : isCreditor ? 'Owed to You' : 'Room Debt'}
                      </span>
                    </div>

                    {/* Flow card: Debtor -> Arrow -> Creditor with amount */}
                    <div className="flex items-center justify-between gap-2 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {s.fromName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {s.fromName}
                            {isDebtor && <span className="text-rose-400 text-[10px] ml-1">(You)</span>}
                          </p>
                          <p className="text-[10px] text-zinc-500">Owes</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center shrink-0 px-2">
                        <span className="text-emerald-400 text-sm font-black font-mono">
                          ₹{s.amount.toFixed(2)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>

                      <div className="flex items-center gap-2 min-w-0 justify-end text-right">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {s.toName}
                            {isCreditor && <span className="text-emerald-400 text-[10px] ml-1">(You)</span>}
                          </p>
                          <p className="text-[10px] text-zinc-500">Gets paid</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {s.toName.charAt(0)}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-2 text-center">
                      <strong className="text-white">{s.fromName}</strong> owes{' '}
                      <strong className="text-emerald-400">{s.toName}</strong>{' '}
                      <span className="font-mono font-semibold text-white">₹{s.amount.toFixed(2)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Room Net Balances Overview */}
        <div className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
            <Users className="w-5 h-5 text-emerald-400" /> Roommate Net Balances
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {balances.map((member) => {
              const isPositive = member.netBalance > 0.01;
              const isNegative = member.netBalance < -0.01;
              const isYou = currentUser && String(currentUser._id) === String(member.id);

              return (
                <div
                  key={member.id}
                  className={`bg-zinc-950 border p-4 rounded-xl flex items-center justify-between ${
                    isYou ? 'border-zinc-700' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold uppercase">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {member.name}
                        {isYou && <span className="text-emerald-400 text-xs ml-1">(You)</span>}
                      </p>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                        {isPositive ? 'Gets Back' : isNegative ? 'Owes' : 'Settled'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold flex items-center justify-end gap-1 font-mono ${
                        isPositive
                          ? 'text-emerald-400'
                          : isNegative
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isNegative ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : null}
                      ₹{Math.abs(member.netBalance).toFixed(2)}
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
            <p className="text-zinc-500 text-sm py-4 text-center">
              No transactions recorded yet for this room.
            </p>
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
                        Paid by{' '}
                        <span className="text-emerald-400 font-semibold">
                          {tx.payer?.name || 'Roommate'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-white font-mono">
                        ₹{tx.totalAmount}
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Order Details per Member */}
                  <div className="space-y-2">
                    {tx.memberOrders?.map((order, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-900/50 p-2.5 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-200">
                            {order.user?.name}:{' '}
                          </span>
                          <span className="text-zinc-400">
                            {order.items?.map((it) => `${it.itemName} (x${it.qty})`).join(', ')}
                          </span>
                        </div>
                        <span className="font-semibold text-emerald-400 font-mono">
                          ₹{order.subTotal}
                        </span>
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