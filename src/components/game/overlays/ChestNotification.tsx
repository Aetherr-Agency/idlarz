import React from 'react';

interface ChestNotificationProps {
  amount: number;
  show: boolean;
  onClose: () => void;
  goldPerSecond?: number;
  minutesAwarded?: number;
}

const ChestNotification: React.FC<ChestNotificationProps> = ({ 
  amount, 
  show, 
  onClose, 
  goldPerSecond = 0,
  minutesAwarded = 0 
}) => {
  if (!show) return null;
  
  return (
    <div 
      className="xxx fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/70 bg-opacity-85 text-yellow-400 py-3 px-5 rounded-lg z-50 flex flex-col items-center gap-1 animate-fadeInOut cursor-pointer shadow-lg border border-amber-400"
      style={{
        boxShadow: '0 0 10px #ffb900'
      }}
      onClick={onClose}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">Claimed {amount.toFixed(0)} bonus gold</span>
        <span className="text-2xl">💰</span>
      </div>
      <span className="text-sm text-yellow-300 font-medium">
        {minutesAwarded.toFixed(1)} minutes of gold income
      </span>
      <span className="text-xs text-yellow-200/80 mt-1">
        Based on your current {goldPerSecond.toFixed(2)} gold/s rate
      </span>
    </div>
  );
};

export default ChestNotification;
