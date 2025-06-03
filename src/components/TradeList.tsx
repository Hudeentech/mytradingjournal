import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface Trade {
  id: string;
  amount: number;
  target: string;
  type: 'profit' | 'loss';
  date: Date;
  notes?: string;
}

interface TradeListProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {trades.map((trade) => {
        const dateObj = trade.date instanceof Date ? trade.date : new Date(trade.date);
        return (
          <div
            key={trade.id}
            className={`p-5 rounded-2xl border-2 backdrop-blur-md bg-white/80 flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${
              trade.type === 'profit' ? 'border-green-200' : 'border-red-200'
            }`}
          >
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {trade.type === 'profit' ? '+' : '-'}${Math.abs(trade.amount).toFixed(2)}
              </h3>
              <p className="text-xs text-gray-500">Target: {trade.target}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full w-fit text-xs font-semibold shadow ${
                trade.type === 'profit'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
            </span>
            {trade.notes && (
              <div className="md:w-1/3 text-xs text-gray-600 italic">
                {trade.notes}
              </div>
            )}
            <div className="text-xs text-gray-400 md:text-right">
              {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
            </div>
            {(onEdit || onDelete) && (
              <div className="flex gap-2 mt-2 md:mt-0">
                {onEdit && (
                  <button
                    onClick={() => onEdit(trade)}
                    className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(trade.id)}
                    className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TradeList;
