import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { QueueTokenItem } from '../types';
import { 
  Tv, 
  Volume2, 
  Clock, 
  Activity, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export const QueueDisplayView: React.FC = () => {
  const [tokens, setTokens] = useState<QueueTokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    fetchQueueDisplay();
    const interval = setInterval(fetchQueueDisplay, 5000); // Poll every 5s for live waiting room TV
    return () => {
      clearInterval(clock);
      clearInterval(interval);
    };
  }, []);

  const fetchQueueDisplay = async () => {
    try {
      const res = await api.get('/queues/display');
      if (res.data.success) {
        setTokens(res.data.data);
      }
    } catch (err) {
      console.error('Queue display fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calledTokens = tokens.filter((t) => t.status === 'called');
  const waitingTokens = tokens.filter((t) => t.status === 'waiting');

  return (
    <div className="space-y-6">
      {/* TV Screen Header */}
      <div className="p-6 rounded-3xl card border border-blue-100 bg-white shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                LIVE OPD FEED
              </span>
              <span className="text-xs text-slate-500 font-medium">Waiting Lounge Public Screen</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900 mt-1">
              Apex Hospital Live Patient Queue
            </h1>
          </div>
        </div>

        <div className="text-left sm:text-right bg-blue-50/80 px-4 py-2.5 rounded-2xl border border-blue-100">
          <div className="text-2xl font-mono font-bold text-blue-700">{time}</div>
          <div className="text-xs text-slate-500 font-medium">Please watch your token number</div>
        </div>
      </div>

      {/* Now Calling Spotlight Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-rose-600 font-mono text-xs font-bold uppercase tracking-wider">
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>Now Calling (Please Proceed to OPD Consultation Chamber)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calledTokens.map((token) => (
            <div
              key={token._id}
              className="p-6 rounded-3xl card border-2 border-blue-500 bg-gradient-to-b from-blue-50/70 via-white to-white shadow-xl shadow-blue-500/10"
            >
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">
                  TOKEN NUMBER
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600 text-white animate-pulse">
                  CALLED NOW
                </span>
              </div>

              <div className="py-5 text-center">
                <div className="text-5xl font-mono font-black text-blue-600 tracking-wider">
                  {token.tokenNumber}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-2">
                  {token.patient?.name || 'Patient'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-100 text-xs text-center space-y-1">
                <div className="text-slate-500 font-medium">Consulting Physician:</div>
                <div className="font-bold text-blue-900 text-sm">{token.doctor?.name || 'Specialist OPD'}</div>
                <div className="text-[11px] text-emerald-700 font-mono font-bold">
                  Room: {token.doctor?.roomNumber || 'Chamber 304'}
                </div>
              </div>
            </div>
          ))}

          {calledTokens.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl card border border-slate-200 text-center text-slate-500 text-sm bg-white">
              All called patients are currently being consulted. Next tokens will be announced shortly.
            </div>
          )}
        </div>
      </div>

      {/* Waiting Queue List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-slate-700 font-mono text-xs font-bold uppercase tracking-wider">
            Up Next In Queue ({waitingTokens.length} Waiting)
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Average consultation duration: ~12 mins</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {waitingTokens.map((token, i) => (
            <div
              key={token._id}
              className="p-4 rounded-2xl card border border-slate-200 bg-white text-center space-y-2 hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="text-[10px] text-slate-400 font-mono font-bold">Position #{i + 1}</div>
              <div className="text-2xl font-mono font-bold text-blue-600">{token.tokenNumber}</div>
              <div className="text-xs text-slate-800 font-semibold truncate">{token.patient?.name}</div>
              <div className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 py-0.5 px-2 rounded-full inline-block">
                ~{token.estimatedWaitMinutes || (i + 1) * 12}m wait
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
