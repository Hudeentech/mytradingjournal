import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import BottomNav from './BottomNav';

const PipsCalculator: React.FC = () => {
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [lotSize, setLotSize] = useState('1');
  const [currency, setCurrency] = useState('EURUSD');  const [marketType, setMarketType] = useState<'forex' | 'synthetic'>('forex');
  const [result, setResult] = useState<{ pips: number; profit: number | null; points?: number }>({
    pips: 0,
    profit: null,
  });

  const calculatePips = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);

    if (!entry || !exit) return;

    let pips: number;
    let points: number | undefined;
    let profit: number;
    const lots = parseFloat(lotSize);

    if (marketType === 'forex') {
      // For JPY pairs
      if (currency.includes('JPY')) {
        pips = (exit - entry) * 100;
        profit = (pips * 0.01) * lots * 100;
      } else {
        pips = (exit - entry) * 10000;
        profit = pips * lots * 10;
      }
      points = undefined;
    } else {
      // For Deriv synthetics
      const difference = exit - entry;
      points = Math.abs(difference);

      // Calculate pips based on the specific synthetic index
      if (currency.includes('VOLATILITY')) {
        pips = points * 100; // Convert points to pips for Volatility indices
        profit = pips * lots;
      } else if (currency.includes('BOOM') || currency.includes('CRASH')) {
        pips = points * 100;
        profit = pips * lots * 0.2; // Boom/Crash have different pip values
      } else {
        pips = points * 100;
        profit = pips * lots;
      }
    }

    setResult({ pips, profit, points });
  };

  return (    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 pb-24">
      <div className="mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Pips & Points Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setMarketType('forex')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  marketType === 'forex'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Forex
              </button>
              <button
                onClick={() => setMarketType('synthetic')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  marketType === 'synthetic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Deriv Synthetic
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency Pair
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                title="Select market"
                aria-label="Select market"
              >
                {marketType === 'forex' ? (
                  <>
                    <option value="EURUSD">EUR/USD</option>
                    <option value="GBPUSD">GBP/USD</option>
                    <option value="USDJPY">USD/JPY</option>
                    <option value="AUDUSD">AUD/USD</option>
                    <option value="USDCAD">USD/CAD</option>
                    <option value="NZDUSD">NZD/USD</option>
                  </>
                ) : (
                  <>
                    <option value="VOLATILITY_10">Volatility 10 Index</option>
                    <option value="VOLATILITY_25">Volatility 25 Index</option>
                    <option value="VOLATILITY_50">Volatility 50 Index</option>
                    <option value="VOLATILITY_75">Volatility 75 Index</option>
                    <option value="VOLATILITY_100">Volatility 100 Index</option>
                    <option value="BOOM_1000">Boom 1000 Index</option>
                    <option value="CRASH_1000">Crash 1000 Index</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Price
              </label>
              <input
                type="number"
                step="0.00001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter entry price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="0.00001"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter exit price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Size
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter lot size"
              />
            </div>

            <button
              onClick={calculatePips}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Calculate
            </button>
            {result.pips !== 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2">
                {marketType === 'synthetic' && result.points !== undefined && (
                  <p className="text-lg font-semibold text-gray-800">
                    Points: {result.points.toFixed(2)}
                    {result.points > 0 ? ' up' : ' down'}
                  </p>
                )}
                <p className="text-lg font-semibold text-gray-800">
                  {marketType === 'forex' ? 'Pips' : 'Ticks'}: {Math.abs(result.pips).toFixed(1)}
                  {result.pips > 0 ? ' profit' : ' loss'}
                </p>
                {result.profit !== null && (
                  <p className="text-md text-gray-600">
                    Estimated {result.profit > 0 ? 'Profit' : 'Loss'}: ${Math.abs(result.profit).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>        <BottomNav />
      </div>
    </div>
  );
};

export default PipsCalculator;
