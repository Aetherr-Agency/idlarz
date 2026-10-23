import React from 'react';
import ResourceIcon from '../ResourceIcon';

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
      className="fixed top-32 left-1/2 transform -translate-x-1/2 px-toast text-[#ffe27a] py-2 px-4 z-[70] flex flex-col items-center gap-1 animate-fadeInOut cursor-pointer"
      onClick={onClose}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">Claimed {amount.toFixed(0)} bonus gold</span>
        <ResourceIcon resource="gold" scale={1} />
      </div>
      <span className="text-sm text-[#f0d27a] font-medium">
        {minutesAwarded.toFixed(1)} minutes of gold income
      </span>
      <span className="text-xs text-[#a89878] mt-1">
        Based on your current {goldPerSecond.toFixed(2)} gold/s rate
      </span>
    </div>
  );
};

export default ChestNotification;
