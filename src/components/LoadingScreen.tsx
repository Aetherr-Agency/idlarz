import React, { useEffect } from 'react';
import { useHydration } from '@/hooks/useHydration';
import { useGameStore } from '@/stores/gameStore';
import '@/styles/LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  const isHydrated = useHydration();
  // Get some game state for debugging
  const tiles = useGameStore((state) => state.tiles);
  
  useEffect(() => {
    console.log('Hydration status:', isHydrated);
    console.log('Has tiles:', !!tiles);
  }, [isHydrated, tiles]);

  // Force show game after 5 seconds regardless of hydration status
  useEffect(() => {
    const forceTimer = setTimeout(() => {
      console.log('Force showing game after timeout');
      document.getElementById('force-show-button')?.click();
    }, 5000);

    return () => clearTimeout(forceTimer);
  }, []);

  if (isHydrated) return null;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-castle">
          🏰
        </div>
        <div className="loading-text">
          Building your kingdom...
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <div className="debug-info">
          <p>Hydration status: {isHydrated ? 'Yes' : 'No'}</p>
          <p>Has tiles: {!!tiles ? 'Yes' : 'No'}</p>
          <button 
            id="force-show-button"
            onClick={() => {
              // Force a re-render using a state update
              window.location.reload();
            }}
            style={{ marginTop: '10px', padding: '5px 10px' }}
          >
            Force Show Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
