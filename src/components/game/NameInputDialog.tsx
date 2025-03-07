import React, { useState } from 'react';
import { useGameStore, useNeedsNameInput } from '@/stores/gameStore';

const NameInputDialog: React.FC = () => {
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const needsNameInput = useNeedsNameInput();
  const [name, setName] = useState('');

  if (!needsNameInput) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setPlayerName(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 border-2 border-blue-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-center mb-4">Welcome, Explorer!</h2>
        <p className="text-gray-300 mb-4">
          Before you begin your adventure, tell us what to call you:
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={9}
              placeholder="Your name (9 chars max)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
            <div className="text-xs text-gray-500 mt-1">
              {9 - name.length} characters remaining
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!name.trim()}
              className={`px-4 py-2 rounded-md font-medium ${
                name.trim() 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Begin Adventure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NameInputDialog;
