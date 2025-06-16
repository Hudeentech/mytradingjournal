import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartSimple, faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { TrendingUp } from "lucide-react";
import {  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import TradeModal from './TradeModal';
import TradeList from './TradeList';

interface TradeEntry {
  id?: string; // _id from MongoDB will be mapped to id
  _id?: string;
  amount: number;
  target: string;
  type: 'profit' | 'loss';
  date: Date | string;
  notes?: string;
}

const API_URL = import.meta.env.PROD 
  ? 'https://mytradingjournal.vercel.app/api/trades'
  : 'http://localhost:4000/api/trades';

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [winLossTimeframe, setWinLossTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);  const navigate = useNavigate();

  // Fetch trades from backend on mount
  useEffect(() => {
    setLoading(true);
    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTrades(data.map((t: any) => ({ ...t, id: t._id, date: t.date ? new Date(t.date) : new Date() })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Add trade to backend
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

  // Fix: filterTradesByTimeframe for weekly/monthly
  function filterTradesByTimeframe(trades: TradeEntry[], timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const now = new Date();
    if (timeframe === 'daily') {
      return trades.filter(trade => {
        const d = trade.date instanceof Date ? trade.date : new Date(trade.date);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }
    if (timeframe === 'weekly') {
      // Get ISO week number for now
      const getWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
      };
      const nowWeek = getWeek(now);
      return trades.filter(trade => {
        const d = trade.date instanceof Date ? trade.date : new Date(trade.date);
        return (
          d.getFullYear() === now.getFullYear() && getWeek(d) === nowWeek
        );
      });
    }
    if (timeframe === 'monthly') {
      return trades.filter(trade => {
        const d = trade.date instanceof Date ? trade.date : new Date(trade.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }
    if (timeframe === 'yearly') {
      return trades.filter(trade => {
        const d = trade.date instanceof Date ? trade.date : new Date(trade.date);
        return d.getFullYear() === now.getFullYear();
      });
    }
    return trades;
  }

  const filteredTrades = filterTradesByTimeframe(trades, timeframe);  const chartData = groupTradesForBarChart(filteredTrades);
  // Use filtered trades for win/loss chart based on winLossTimeframe
  const winLossFilteredTrades = filterTradesByTimeframe(trades, winLossTimeframe);
  const winRateBarData = groupNetPLPerPeriod(winLossFilteredTrades, winLossTimeframe);
  const stats = calculateStats(filteredTrades);

  // Helper to group trades by day/week/month/year  // Helper to group trades by day and provide target, profit, and loss for each day
  function groupTradesForBarChart(trades: TradeEntry[]) {
    // Days of the week
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Map: day index (0=Mon, 1=Tue, ..., 6=Sun) -> { target, profit, loss }
    const map = new Map<number, { target: number, profit: number, loss: number }>();
    trades.forEach(trade => {
      const date = trade.date instanceof Date ? trade.date : new Date(trade.date);
      // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat. We want 0=Mon, 6=Sun
      const jsDay = date.getDay();
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
      const profit = trade.type === 'profit' ? trade.amount : 0;
      const loss = trade.type === 'loss' ? trade.amount : 0;
      const target = parseFloat(trade.target) || 0;
      if (!map.has(dayIdx)) {
        map.set(dayIdx, { target: 0, profit: 0, loss: 0 });
      }
      map.get(dayIdx)!.target += target;
      map.get(dayIdx)!.profit += profit;
      map.get(dayIdx)!.loss += loss;
    });
    // Always show all days Mon-Sun
    return weekDays.map((name, idx) => {
      const d = map.get(idx) || { target: 0, profit: 0, loss: 0 };
      return { name, ...d };
    });
  }

  // Helper to group trades for win rate per timeframe
  function groupPerformance(trades: TradeEntry[], tf: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const map = new Map<string, { win: number; total: number }>();
    trades.forEach(trade => {
      const date = trade.date instanceof Date ? trade.date : new Date(trade.date);
      let key = '';
      if (tf === 'daily') {
        key = date.toLocaleDateString();
      } else if (tf === 'weekly') {
        const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
        key = week;
      } else if (tf === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else if (tf === 'yearly') {
        key = `${date.getFullYear()}`;
      }
      if (!map.has(key)) map.set(key, { win: 0, total: 0 });
      if (trade.type === 'profit') map.get(key)!.win++;
      map.get(key)!.total++;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, { win, total }]) => ({ name, winRate: total ? (win / total) * 100 : 0, win, total }));
  }

  // Helper to group trades for net P/L per period for win rate chart
  function groupNetPLPerPeriod(trades: TradeEntry[], tf: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const now = new Date();
    if (tf === 'daily') {
      // Always show Mon-Sun, most recent first (ending with today)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      // Build last 7 days, ending with today
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const idx = ((d.getDay() + 6) % 7);
        return { name: weekDays[idx], date: d, idx };
      });
      // Map: day string (yyyy-mm-dd) -> net
      const netMap = new Map<string, number>();
      trades.forEach(trade => {
        const date = trade.date instanceof Date ? trade.date : new Date(trade.date);
        const key = date.toISOString().slice(0, 10);
        const net = trade.type === 'profit' ? trade.amount : -trade.amount;
        netMap.set(key, (netMap.get(key) || 0) + net);
      });
      return days.map(({ name, date }) => {
        const key = date.toISOString().slice(0, 10);
        return { name, net: netMap.get(key) || 0 };
      });
    } else if (tf === 'weekly') {
      // Show last 8 weeks (including this week)
      const getWeek = (d: Date) => {
        const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = dt.getUTCDay() || 7;
        dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(dt.getUTCFullYear(),0,1));
        return Math.ceil((((dt as any) - (yearStart as any)) / 86400000 + 1) / 7);
      };
      const weeks = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 7 * (7 - i));
        const year = d.getFullYear();
        const week = getWeek(d);
        return { name: `${year}-W${week}`, year, week };
      });
      // Map: year-week -> net
      const netMap = new Map<string, number>();
      trades.forEach(trade => {
        const date = trade.date instanceof Date ? trade.date : new Date(trade.date);
        const year = date.getFullYear();
        const week = getWeek(date);
        const key = `${year}-W${week}`;
        const net = trade.type === 'profit' ? trade.amount : -trade.amount;
        netMap.set(key, (netMap.get(key) || 0) + net);
      });
      return weeks.map(({ name }) => ({ name, net: netMap.get(name) || 0 }));
    } else if (tf === 'monthly') {
      // Show last 12 months (including this month)
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return { name: `${year}-${month}`, year, month };
      });
      // Map: year-month -> net
      const netMap = new Map<string, number>();
      trades.forEach(trade => {
        const date = trade.date instanceof Date ? trade.date : new Date(trade.date);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const key = `${year}-${month}`;
        const net = trade.type === 'profit' ? trade.amount : -trade.amount;
        netMap.set(key, (netMap.get(key) || 0) + net);
      });
      return months.map(({ name }) => ({ name, net: netMap.get(name) || 0 }));
    } else if (tf === 'yearly') {
      // Show last 5 years (including this year)
      const years = Array.from({ length: 5 }, (_, i) => {
        const year = now.getFullYear() - (4 - i);
        return { name: `${year}`, year };
      });
      // Map: year -> net
      const netMap = new Map<string, number>();
      trades.forEach(trade => {
        const date = trade.date instanceof Date ? trade.date : new Date(trade.date);
        const year = date.getFullYear();
        const key = `${year}`;
        const net = trade.type === 'profit' ? trade.amount : -trade.amount;
        netMap.set(key, (netMap.get(key) || 0) + net);
      });
      return years.map(({ name }) => ({ name, net: netMap.get(name) || 0 }));
    }
    return [];
  }

  // Update calculateStats to accept filtered trades
  function calculateStats(tradesList: TradeEntry[] = filteredTrades) {
    return {
      totalProfit: tradesList.reduce((sum, trade) => sum + (trade.type === 'profit' ? trade.amount : 0), 0),
      totalLoss: tradesList.reduce((sum, trade) => sum + (trade.type === 'loss' ? trade.amount : 0), 0),
      winRate: tradesList.length > 0 ? (tradesList.filter(t => t.type === 'profit').length / tradesList.length) * 100 : 0,
    };
  }

  // Fix TradeList type error by filtering out undefined ids and ensuring date is a Date object
  const safeTrades = trades
    .map(t => ({...t, id: t.id || t._id || '', date: t.date instanceof Date ? t.date : new Date(t.date)}))
    .filter(t => t.id);
  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // Only render after loading is false
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="text-2xl text-blue-600 font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex flex-col justify-between">
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

      <div className="w-[95%] mx-auto pb-24">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
          <div>
            <h1 className="text-4xl px-2 my-4 font-medium text-gray-900 tracking-tight-lg">Dashboard</h1>
            <div className="flex px-2 gap-2 mt-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors duration-150 ${
                    timeframe === period
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-blue-100 border border-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-10">
          <div className="backdrop-blur-lg col-span-2 md:col-auto bg-white/80 border border-white/40 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-md lg:text-lg text-gray-500 mb-2">Win Rate</h2>
            <p className="text-xl font-extrabold text-blue-600">{stats.winRate.toFixed(1)}%</p>
          </div>
          <div className="backdrop-blur-lg bg-white/80 border border-white/40 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-md lg:text-lg text-gray-500 mb-2">Total Profit</h2>
            <p className="text-xl font-extrabold text-green-600">${stats.totalProfit.toFixed(2)}</p>
          </div>
          <div className="backdrop-blur-lg bg-white/80 border border-white/40 rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-md lg:text-lg  text-gray-500 mb-2">Total Loss</h2>
            <p className="text-xl font-extrabold text-red-500">${stats.totalLoss.toFixed(2)}</p>
          </div>
        </div>

        {/* Performance Bar Chart using shadcn/ui Card and Recharts BarChart */}
        <div className="bg-white/80 border border-white/40 rounded-2xl mb-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Chart</CardTitle>
              <CardDescription>{/* You can add a date range or summary here */}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    barGap={2}
                    margin={{ top: 0, right: 0, left: -5, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      tickMargin={5} 
                      axisLine={false}
                      fontSize={12}
                    />
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="target" fill="#a3a3a3" radius={[4, 4, 0, 0]} maxBarSize={45} name="Target" />
                    <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={45} name="Profit" />
                    <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={45} name="Loss" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing performance for the selected period
              </div>
            </CardFooter>
          </Card>
        </div>        <Card className="mb-10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle>Profit/Loss Trend</CardTitle>
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setWinLossTimeframe(period)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow transition-colors duration-150 ${
                      winLossTimeframe === period
                        ? 'bg-gradient-to-r from-green-600 to-blue-500 text-white scale-105'
                        : 'bg-white/70 text-gray-700 hover:bg-green-100 border border-gray-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <CardDescription>
              {winLossTimeframe.charAt(0).toUpperCase() + winLossTimeframe.slice(1)} performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>              <div className="w-full h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%"><LineChart
                  data={winRateBarData}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={5}
                    fontSize={12}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={45}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    cursor={false}
                    formatter={(value: number) => [`$${value >= 0 ? '+' : ''}${value.toFixed(2)}`, 'Net P/L']}
                  />
                  <Line
                    type="step"
                    dataKey="net"
                    stroke="var(--chart-1, #22c55e)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              {winRateBarData[winRateBarData.length - 1]?.net >= 0 ? 'Trending up' : 'Trending down'} by {Math.abs(winRateBarData[winRateBarData.length - 1]?.net || 0).toFixed(1)}% <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              Showing {winLossTimeframe} profit/loss trend
            </div>
          </CardFooter>
        </Card>

        <div className="bg-white/80 border border-white/40 rounded-2xl  p-2 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Trades</h2>
          {safeTrades.length === 0 ? (
            <p className="text-gray-400 text-center">No trades recorded yet</p>
          ) : (
            <TradeList trades={safeTrades} />
          )}
        </div>
      </div>      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200 shadow-lg flex justify-around items-center py-3 z-50">
        <button
          onClick={() => navigate('/home')}
          className="flex flex-col items-center text-gray-600 font-semibold focus:outline-none"
        >
          <FontAwesomeIcon icon={faHome} size="lg" />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow-lg w-14 h-14 -mt-8 border-4 border-white focus:outline-none hover:scale-105 transition-transform duration-200"
          title="Add Trade"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center text-blue-600 font-semibold focus:outline-none"
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
        onClose={() => setIsModalOpen(false)}
        onSave={addTrade}
      />
    </div>
  );
};

export default Dashboard;
