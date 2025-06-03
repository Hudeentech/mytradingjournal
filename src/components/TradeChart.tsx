import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string; // day label
  target: number;
  profit: number;
  loss: number;
}

interface TradeChartProps {
  data: ChartData[];
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

const TradeChart: React.FC<TradeChartProps> = ({ data, timeframe }) => {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number, name) => [`$${value.toFixed(2)}`, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : '']} />
          <Legend />
          <Bar dataKey="target" fill="#a3a3a3" name="Target" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" fill="#22c55e" name="Profit" radius={[4, 4, 0, 0]} />
          <Bar dataKey="loss" fill="#ef4444" name="Loss" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradeChart;
