import React, { useState } from 'react';
import { BarChart2, PlusCircle, Check, X, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface PollsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PollsModal: React.FC<PollsModalProps> = ({ isOpen, onClose }) => {
  const { currentPoll, startPoll, votePoll, closePoll, currentUser } = useSocket();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['Yes', 'No']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!cleanQuestion || cleanOptions.length < 2) return;

    startPoll(cleanQuestion, cleanOptions);
    setQuestion('');
    setOptions(['Yes', 'No']);
  };

  const totalVotes = currentPoll?.options.reduce((acc, o) => acc + o.votes, 0) || 0;
  const isCreator = currentPoll?.creatorId === currentUser?.id || currentUser?.role === 'host';

  return (
    <div
      id="polls-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Live Room Poll</h2>
              <p className="text-[11px] text-slate-400">Audience voting and instant consensus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-xs space-y-4">
          {/* Active Poll View */}
          {currentPoll ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-1">
                  Active Poll • {totalVotes} total votes
                </div>
                <h3 className="text-sm font-bold text-slate-100 mb-3">{currentPoll.question}</h3>

                <div className="space-y-2">
                  {currentPoll.options.map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => votePoll(opt.id)}
                        className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-left relative overflow-hidden group cursor-pointer"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-teal-500/20 transition-all duration-300 pointer-events-none"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex items-center justify-between z-10">
                          <span className="font-semibold text-slate-200">{opt.text}</span>
                          <span className="text-[11px] font-mono text-teal-400 font-bold">
                            {opt.votes} ({percentage}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isCreator && (
                <button
                  onClick={closePoll}
                  className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-semibold transition"
                >
                  End & Clear Active Poll
                </button>
              )}
            </div>
          ) : (
            /* Create New Poll Form */
            <form onSubmit={handleStart} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Poll Question</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Should we play music next?"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Options</label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-lg px-3 py-1.5 text-slate-100 outline-hidden"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold pt-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Another Option</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition shadow"
                >
                  Start Poll
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
