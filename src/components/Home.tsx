import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TradeList from './TradeList';
import TradeModal from './TradeModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import BottomNav from './BottomNav';

interface Trade {
  id: string;
  amount: number;
  target: string;
  type: 'profit' | 'loss';
  date: Date;
  notes?: string;
}

const API_URL = import.meta.env.PROD 
  ? 'https://mytradingjournal.vercel.app/api/trades'
  : 'http://localhost:4000/api/trades';

const Home: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    setLoading(true);
    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTrades(data.map((t: any) => ({ ...t, id: t._id, date: new Date(t.date) })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addTrade = async (tradeData: { amount: number; target: string; type: 'profit' | 'loss'; notes?: string }) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ ...tradeData, date: new Date() }),
    });
    const saved = await res.json();
    setTrades([{ ...saved, id: saved._id, date: new Date(saved.date) }, ...trades]);
  };

  const updateTrade = async (id: string, tradeData: { amount: number; target: string; type: 'profit' | 'loss'; notes?: string }) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(tradeData),
    });
    const updated = await res.json();
    setTrades(trades.map(t => t.id === id ? { ...updated, id: updated._id, date: new Date(updated.date) } : t));
  };

  const deleteTrade = async (id: string) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    setTrades(trades.filter(t => t.id !== id));
  };

  const handleSave = (trade: { amount: number; target: string; type: 'profit' | 'loss'; notes?: string }) => {
    if (editingTrade) {
      updateTrade(editingTrade.id, trade);
      setEditingTrade(null);
    } else {
      addTrade(trade);
    }
    setIsModalOpen(false);
  };

  const calculateTotalPnL = () => {
    return trades.reduce((total, trade) => {
      return total + (trade.type === 'profit' ? trade.amount : -trade.amount);
    }, 0);
  };

  const totalPnL = calculateTotalPnL();
  const isProfit = totalPnL >= 0;
  const recentTrades = trades.slice(0, 5);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="text-2xl text-blue-600 font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Welcome, {username || 'Trader'}
        </h1>
        <div className="relative">          <button 
            onClick={() => setShowLogout(!showLogout)}
            className="p-2 hover:bg-gray-200 rounded-full"
            title="Open menu"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
          {showLogout && (
            <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md z-20">
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="backdrop-blur-lg bg-white/70 border border-white/40 min-h-svh rounded-3xl p-4 w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-medium text-gray-900 text-left mb-8 w-full tracking-tight">Trading Performance</h1>
          <div className={`w-full h-[200px] flex justify-center flex-col gap-4 text-left p-8 rounded-2xl shadow-lg ${
            isProfit ? 'bg-gradient-to-r from-green-100 to-green-50' : 'bg-gradient-to-r from-red-100 to-red-50'          }`}>
            <div className="relative">
              <button
                onClick={() => { setEditingTrade(null); setIsModalOpen(true); }}
                className="absolute -top-14 -right-10 w-14 h-14 flex items-center border-2 border-white justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow-lg focus:outline-none hover:scale-105 transition-transform duration-200"
                title="Add Trade"
                aria-label="Add Trade"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <p className="text-base font-medium py-2 text-gray-500 mb-2">Total P/L</p>
              <p className={`text-5xl font-semibold tracking-tight ${
                isProfit ? 'text-green-600' : 'text-red-500'
              }`}>
                {isProfit ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="w-full mt-8">
            <h2 className="text-lg font-medium text-gray-700 mb-2">Recent Trades</h2>
            {recentTrades.length === 0 ? (
              <p className="text-gray-400 text-center">No trades yet</p>
            ) : (
              <TradeList
                trades={recentTrades}
                onEdit={trade => { setEditingTrade(trade); setIsModalOpen(true); }}
                onDelete={deleteTrade}
              />
            )}
          </div>
        </div>
      </div>        <BottomNav />
      <TradeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTrade(null); }}
        onSave={handleSave}
        trade={editingTrade}
      />
    </div>
  );
};

export default Home;

/* Add this to index.css or a global CSS file:
.custom-fab-shadow {
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
*/
