import { useState } from 'react';
import type { Item, EquipmentSlot } from '@/types/game';

interface DragDropState {
  isDragging: boolean;
  draggedItem: Item | null;
  draggedSlot: EquipmentSlot | null;
}

export const useDragDrop = () => {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedItem: null,
    draggedSlot: null,
  });

  const handleDragStart = (item: Item, slot?: EquipmentSlot) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      draggedSlot: slot || null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      draggedSlot: null,
    });
  };

  return {
    ...dragState,
    handleDragStart,
    handleDragEnd,
  };
};
