import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useHydration } from '@/hooks/useHydration';
import '@/styles/LevelUpNotification.css';

const LevelUpNotification: React.FC = () => {
  const level = useGameStore((state) => state.level);
  const isHydrated = useHydration();
  const [showNotification, setShowNotification] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level.level);
  
  // Don't process level changes until the store is hydrated
  useEffect(() => {
    if (!isHydrated) return;
    
    // Check if level increased
    if (level.level > prevLevel) {
      // Show the notification
      setShowNotification(true);
      
      // Auto-hide after 10 seconds
      const timeout = setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      
      // Clean up timeout
      return () => clearTimeout(timeout);
    }
    
    // Update previous level
    setPrevLevel(level.level);
  }, [level.level, prevLevel, isHydrated]);

  if (!showNotification) return null;

  return (
    <div 
      className="level-up-notification"
      onClick={() => setShowNotification(false)}
    >
      <div className="level-up-emoji">
        🎉
      </div>
      <div className="level-up-text">
        Level Up!
      </div>
    </div>
  );
};

export default LevelUpNotification;
