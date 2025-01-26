import React from 'react';
import { ObjectType, Counts } from '../types';

interface ControlsProps {
  isRunning: boolean;
  speed: number;
  counts: Counts;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onCountChange: (type: ObjectType, count: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRunning,
  speed,
  counts,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  onCountChange,
}) => {
  return (
    <div className="w-full max-w-[600px] bg-white rounded-xl shadow-md p-6">
      <div className="space-x-4 mb-8 flex justify-center">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors font-medium"
        >
          Start
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg disabled:opacity-50 hover:bg-red-700 transition-colors font-medium"
        >
          Stop
        </button>
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Reset
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-6">
          <label className="w-24 font-semibold text-gray-700">Speed:</label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="flex-1 h-2 accent-blue-600"
          />
          <input
            type="number"
            min="0.5"
            max="10"
            step="0.5"
            value={speed}
            onChange={(e) => {
              const newSpeed = Math.min(10, Math.max(0.5, parseFloat(e.target.value) || 0.5));
              onSpeedChange(newSpeed);
            }}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
          />
        </div>
      </div>

      <div className="space-y-6">
        {(Object.keys(counts) as ObjectType[]).map(type => (
          <div key={type} className="flex items-center space-x-6">
            <label className="w-24 capitalize font-semibold text-gray-700">{type}:</label>
            <input
              type="range"
              min="0"
              max="50"
              value={counts[type]}
              onChange={(e) => onCountChange(type, parseInt(e.target.value))}
              className="flex-1 h-2 accent-blue-600"
            />
            <input
              type="number"
              min="0"
              max="50"
              value={counts[type]}
              onChange={(e) => {
                const value = Math.min(50, Math.max(0, parseInt(e.target.value) || 0));
                onCountChange(type, value);
              }}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Controls; 