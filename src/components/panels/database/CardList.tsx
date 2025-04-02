import React from 'react';
import { Card } from './Card';
import { useDispatch } from 'react-redux';
import { updateContentType } from '../../../features/selectedItemSlice';

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
  contentType?: any;
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
  const dispatch = useDispatch();
  
  // Handler for content type detection/correction
  const handleContentTypeDetected = (hash: string, contentType: any) => {
    console.log(`CardList - Content type detected for ${hash}:`, contentType);
    
    // Only update the content type if this is the selected card
    if (hash === selectedCardHash) {
      dispatch(updateContentType({ contentType }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {!cards || cards.items.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No cards available.</div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {cards.retrievalMethod === 'hash'
              ? 'Card found by hash'
              : `Showing ${cards.items.length} of ${cards.total_items} cards`}
            {cards.serverTimestamp && ` (as of ${formatDate(cards.serverTimestamp)})`}
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {cards.items.map((card) => (
              <Card
                key={card.hash}
                card={card}
                isSelected={selectedCardHash === card.hash}
                onSelect={onSelectCard}
                onContentTypeDetected={handleContentTypeDetected}
              />
            ))}
          </div>
        </>
      )}
      
      {loading && (
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
