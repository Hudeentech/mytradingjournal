/** @jsxImportSource @emotion/react */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface Trade {
  id: string;
  amount: number;
  target: string;
  type: 'profit' | 'loss';
  date: string | Date;
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
      {trades.map((trade) => (
        <div
          key={trade.id}
          className={`p-5 rounded-2xl border-2 backdrop-blur-md bg-white/80 relative ${
            trade.type === 'profit' ? 'border-green-200' : 'border-red-200'
          }`}
        >
          {/* Edit/Delete buttons positioned absolutely at top right */}
          {(onEdit || onDelete) && (
            <div className="absolute top-3 right-3 flex gap-2">
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

          {/* Main content */}
          <div className="mt-4">
            {/* Amount and profit/loss tag in one line */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg text-gray-900">
                {trade.type === 'profit' ? '+' : '-'}${Math.abs(trade.amount).toFixed(2)}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${
                  trade.type === 'profit'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
              </span>
            </div>

            {/* Target and date info */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <p className="text-xs text-gray-500">Target: {trade.target}</p>
              <div className="text-xs text-gray-400">
                {new Date(trade.date).toLocaleDateString()}{' '}
                {new Date(trade.date).toLocaleTimeString()}
              </div>
            </div>

            {/* Notes section at bottom with separator */}
            {trade.notes && (
              <>
                <div className="h-px bg-gray-200 my-3" />
                <div className="text-sm text-gray-600">
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes:</p>
                  {trade.notes}
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TradeList;
