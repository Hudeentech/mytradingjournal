import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TradeList from './TradeList';
import TradeModal from './TradeModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartSimple, faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface Trade {
  id: string;
  amount: number;
  target: string;
  type: 'profit' | 'loss';
  date: Date;
  notes?: string;
}

const API_URL = 'http://localhost:4000/api/trades';

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
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      {/* Top bar with logout icon */}
      <div className="flex justify-end items-center p-4">
        <button
          onClick={() => setShowLogout(true)}
          className="text-gray-600 hover:text-red-500 transition-colors text-2xl"
          title="Logout"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="backdrop-blur-lg bg-white/70 border border-white/40 shadow-2xl rounded-3xl p-4 w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-semibold text-gray-900 text-left mb-8 w-full tracking-tight">Trading Performance</h1>
          <div className={`w-full text-center p-8 rounded-2xl shadow-lg ${
            isProfit ? 'bg-gradient-to-r from-green-100 to-green-50' : 'bg-gradient-to-r from-red-100 to-red-50'
          }`}>
            <p className="text-base font-medium text-gray-500 mb-2">Total P/L</p>
            <p className={`text-3xl font-bold tracking-tight ${
              isProfit ? 'text-green-600' : 'text-red-500'
            }`}>
              {isProfit ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
            </p>
          </div>
          <div className="w-full mt-8">
            <h2 className="text-lg font-bold text-gray-700 mb-2">Recent Trades</h2>
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
      </div>
      {/* Add Trade Floating Button */}
      <button
        onClick={() => { setEditingTrade(null); setIsModalOpen(true); }}
        className="fixed bottom-4 inset-x-0 mx-auto z-100 w-fit bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform duration-200 custom-fab-shadow"
        title="Add Trade"
      >
        <FontAwesomeIcon icon={faPlus} size="lg" />
      </button>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200 shadow-lg flex justify-around py-3 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center text-blue-600 font-semibold focus:outline-none"
        >
          <FontAwesomeIcon icon={faHome} size="lg" />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center text-gray-600 font-semibold focus:outline-none"
        >
          <FontAwesomeIcon icon={faChartSimple} size="lg" />
          <span className="text-xs">Dashboard</span>
        </button>
      </nav>
      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-xs w-full flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4">Log out?</h2>
            <p className="mb-6 text-gray-600 text-center">Are you sure you want to log out?</p>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogout(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
