import * as React from 'react';

export function DevConsole() {
  const handleReset = () => {
    localStorage.removeItem('gameState');
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
    }}>
      <h3>Dev Console</h3>
      <button
        onClick={handleReset}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '8px 12px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Reset Saved State
      </button>
    </div>
  );
}
