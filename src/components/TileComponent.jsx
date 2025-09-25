import React from 'react';
import { Star } from 'lucide-react';

const TILE_COLORS = {
  red: 'text-red-600',
  blue: 'text-blue-600', 
  yellow: 'text-yellow-600',
  black: 'text-gray-800'
};

const TILE_BG_COLORS = {
  red: 'from-red-50 to-red-100',
  blue: 'from-blue-50 to-blue-100',
  yellow: 'from-yellow-50 to-yellow-100', 
  black: 'from-gray-50 to-gray-100'
};

export default function TileComponent({ 
  tile, 
  isSelected = false, 
  onClick, 
  size = 'normal',
  draggable = false,
  className = ''
}) {
  const sizeClasses = {
    small: 'w-8 h-12 text-xs',
    normal: 'w-12 h-16 text-sm',
    large: 'w-16 h-20 text-base'
  };

  const handleClick = () => {
    if (onClick) {
      onClick(tile.id);
    }
  };

  const tileClass = `
    ${sizeClasses[size]}
    relative
    rounded-lg
    border-2
    cursor-pointer
    transition-all
    duration-200
    transform
    hover:scale-105
    hover:shadow-lg
    active:scale-95
    select-none
    ${isSelected 
      ? 'border-orange-400 shadow-lg shadow-orange-200 -translate-y-1' 
      : 'border-gray-300 hover:border-gray-400'
    }
    ${onClick ? 'cursor-pointer' : 'cursor-default'}
    ${className}
  `;

  if (tile.isJoker) {
    return (
      <div
        className={`${tileClass} bg-gradient-to-br from-purple-100 via-pink-100 via-blue-100 to-green-100 shadow-md`}
        onClick={handleClick}
        draggable={draggable}
      >
        {/* 3D effect borders */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-full rounded-lg bg-gradient-to-tl from-black/10 to-transparent pointer-events-none"></div>
        
        {/* Joker star */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Star 
            className="w-6 h-6 text-white drop-shadow-lg" 
            fill="url(#joker-gradient)"
          />
          <svg width="0" height="0">
            <defs>
              <linearGradient id="joker-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="25%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="75%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${tileClass} bg-gradient-to-br ${TILE_BG_COLORS[tile.color]} shadow-md`}
      onClick={handleClick}
      draggable={draggable}
    >
      {/* 3D effect borders */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-full h-full rounded-lg bg-gradient-to-tl from-black/15 to-transparent pointer-events-none"></div>
      
      {/* Number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className={`font-bold ${TILE_COLORS[tile.color]} drop-shadow-sm`}
          style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.1), 0 0 4px rgba(255,255,255,0.8)'
          }}
        >
          {tile.number}
        </span>
      </div>
      
      {/* Corner numbers for better visibility */}
      <div className={`absolute top-0.5 left-0.5 text-xs font-bold ${TILE_COLORS[tile.color]} opacity-60`}>
        {tile.number}
      </div>
      <div className={`absolute bottom-0.5 right-0.5 text-xs font-bold ${TILE_COLORS[tile.color]} opacity-60 transform rotate-180`}>
        {tile.number}
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>
      )}
    </div>
  );
}
