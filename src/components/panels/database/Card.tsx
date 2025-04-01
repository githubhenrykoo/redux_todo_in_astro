import React from 'react';
interface CardProps {
  card: {
    hash: string;
    g_time: string;
  };
  isSelected: boolean;
  onSelect: (card: { hash: string; g_time: string; }) => void;
}

export const Card: React.FC<CardProps> = ({ card, isSelected, onSelect }) => {
  return (
    <div
      className={`border rounded p-3 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
      onClick={() => onSelect(card)}
    >
      <div className="flex justify-between mb-1">
        <span 
          className="font-medium text-blue-600 text-sm truncate max-w-[150px]"
          title={card.hash}
        >
          {card.hash.substring(0, 8)}...
        </span>
        <span className="text-gray-500 text-xs ml-2 whitespace-nowrap">
          {card.g_time}
        </span>
      </div>
    </div>
  );
};
