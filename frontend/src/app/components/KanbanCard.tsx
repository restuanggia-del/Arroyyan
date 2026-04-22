import { useDrag } from 'react-dnd';
import { GripVertical, User } from 'lucide-react';

export interface Card {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
}

interface KanbanCardProps {
  card: Card;
}

export function KanbanCard({ card }: KanbanCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  return (
    <div
      ref={drag}
      className={`bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 flex-1">{card.title}</h3>
        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>

      <p className="text-sm text-gray-600 mb-3">{card.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-gray-700">{card.assignee}</span>
        </div>

        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[card.priority]}`}>
          {card.priority}
        </span>
      </div>
    </div>
  );
}
