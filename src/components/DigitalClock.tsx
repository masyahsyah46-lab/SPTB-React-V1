import React, { useState, useEffect } from 'react';

export const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const day = time.toLocaleDateString('ms-MY', { weekday: 'long' });
  const date = time.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = time.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-none mb-1">
        {day}, {date}
      </div>
      <div className="text-xl font-black tabular-nums text-slate-800 leading-none">
        {timeStr}
      </div>
    </div>
  );
};
