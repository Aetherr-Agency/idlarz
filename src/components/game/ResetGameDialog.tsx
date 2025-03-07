import React, { useState } from 'react';

const ResetGameDialog: React.FC = () => {
  const [showResetButton, setShowResetButton] = useState(true);
  
  const handleReset = () => {
    // Clear all localStorage data
    localStorage.clear();
    // Reload the page to start fresh
    window.location.reload();
    setShowResetButton(false);
  };

  if (!showResetButton) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleReset}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Reset Game (Testing)
      </button>
    </div>
  );
};

export default ResetGameDialog;
