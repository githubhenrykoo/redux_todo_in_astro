import React from 'react';
import { Card } from './Card';

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleString();
  } catch (e) {
    return 'N/A';
  }
};

interface MCardFromData {
  hash: string;
  g_time: string;
  content?: any;
}

interface PageData {
  items: MCardFromData[];
  total_items: number;
  serverTimestamp?: string;
  retrievalMethod?: string;
}

interface CardListProps {
  cards: PageData | null;
  selectedCardHash: string | null;
  onSelectCard: (card: MCardFromData) => void;
  loading: boolean;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  selectedCardHash,
  onSelectCard,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!cards || cards.items.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        {cards ? 'No cards found' : 'Enter search terms or fetch cards'}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Results Summary */}
      <div className="mb-2">
        <p className="text-sm text-gray-700">
          {cards.retrievalMethod === 'hash'
            ? 'Card found by hash'
            : `Showing ${cards.items.length} of ${cards.total_items} cards`}
          {cards.serverTimestamp && ` (as of ${formatDate(cards.serverTimestamp)})`}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {cards.items.map((card) => (
          <Card
            key={card.hash}
            card={card}
            isSelected={selectedCardHash === card.hash}
            onSelect={onSelectCard}
          />
        ))}
      </div>
    </div>
  );
};
