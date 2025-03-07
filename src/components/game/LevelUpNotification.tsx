import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useHydration } from '@/hooks/useHydration';
import '@/styles/LevelUpNotification.css';

const LevelUpNotification: React.FC = () => {
  const level = useGameStore((state) => state.level);
  const isHydrated = useHydration();
  const [showNotification, setShowNotification] = useState(false);
  // Use a ref to track initial level to avoid false positives during hydration
  const initialLevelRef = useRef<number | null>(null);
  const [prevLevel, setPrevLevel] = useState(0);
  const initialLoadCompleted = useRef(false);
  
  // Initialize the level tracking once hydration is complete
  useEffect(() => {
    if (isHydrated && initialLevelRef.current === null) {
      // Set the initial level reference on first hydration
      initialLevelRef.current = level.level;
      setPrevLevel(level.level);
      
      // Mark initial load as completed after a brief delay
      setTimeout(() => {
        initialLoadCompleted.current = true;
        console.log('Initial level tracking initialized:', level.level);
      }, 500);
    }
  }, [isHydrated, level.level]);
  
  // Only process level changes after hydration and initial setup
  useEffect(() => {
    // Don't check for level changes until hydration is complete and initial setup is done
    if (!isHydrated || !initialLoadCompleted.current) return;
    
    // Check if level increased
    if (level.level > prevLevel) {
      console.log(`Level up detected: ${prevLevel} -> ${level.level}`);
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
