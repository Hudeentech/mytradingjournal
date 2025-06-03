import React, { useState } from 'react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: {
    amount: number;
    target: string;
    type: 'profit' | 'loss';
    notes?: string;
  }) => void;
  trade?: {
    amount: number;
    target: string;
    type: 'profit' | 'loss';
    notes?: string;
  } | null;
}

const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, onSave, trade }) => {
  const [amount, setAmount] = useState(trade ? String(trade.amount) : '');
  const [target, setTarget] = useState(trade ? trade.target : '');
  const [notes, setNotes] = useState(trade ? trade.notes || '' : '');
  const [type, setType] = useState<'profit' | 'loss'>(trade ? trade.type : 'profit');

  React.useEffect(() => {
    if (trade) {
      setAmount(String(trade.amount));
      setTarget(trade.target);
      setNotes(trade.notes || '');
      setType(trade.type);
    } else {
      setAmount('');
      setTarget('');
      setNotes('');
      setType('profit');
    }
  }, [trade, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      amount: parseFloat(amount),
      target,
      type,
      notes,
    });
    // Reset form
    setAmount('');
    setTarget('');
    setNotes('');
    setType('profit');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/90 border border-white/40 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-left">{trade ? 'Edit Trade' : 'Add New Trade'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 p-3 outline outline-blue-200 focus:border-primary focus:ring-primary bg-gray-50"
              required
              placeholder='Enter amount in $'
            />
          </div>
          <div>
            <label htmlFor="target" className="block text-sm font-semibold text-gray-700 mb-1">
              Target
            </label>
            <input
              type="text"
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 p-3 outline outline-blue-200 focus:border-primary focus:ring-primary bg-gray-50"
              required
              placeholder='Enter target (e.g. The amount you want to reach)'
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Trade Result</label>
            <div className="mt-2 flex gap-4">
              <button
                type="button"
                onClick={() => setType('profit')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  type === 'profit'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Profit
              </button>
              <button
                type="button"
                onClick={() => setType('loss')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-indigo-500 to-red-500 text-white ${
                  type === 'loss'
                    ? 'bg-gradient-to-r from-red-500 to-pink-400 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Loss
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300  focus:border-primary focus:ring-primary bg-gray-50"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-lg font-bold shadow hover:scale-105 transition-transform duration-200"
            >
              Save Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
