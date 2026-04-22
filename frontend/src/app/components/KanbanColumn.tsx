import { useDrop } from "react-dnd";
import { KanbanCard, Card } from "./KanbanCard";

interface KanbanColumnProps {
  title: string;
  cards: Card[];
  columnId: string;
  onCardDrop: (cardId: string, targetColumn: string) => void;
  color: string;
}

export function KanbanColumn({
  title,
  cards,
  columnId,
  onCardDrop,
  color,
}: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "card",
    drop: (item: { id: string }) => {
      onCardDrop(item.id, columnId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex flex-col min-w-[320px] flex-1">
      <div
        className={`${color} rounded-t-lg px-4 py-3 flex items-center justify-between`}
      >
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className="bg-white/80 text-gray-700 text-sm px-2 py-1 rounded-full">
          {cards.length}
        </span>
      </div>

      <div
        ref={drop}
        className={`bg-gray-50 rounded-b-lg p-4 flex-1 min-h-[500px] space-y-3 transition-colors ${
          isOver ? "bg-blue-50 ring-2 ring-blue-300" : ""
        }`}
      >
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
