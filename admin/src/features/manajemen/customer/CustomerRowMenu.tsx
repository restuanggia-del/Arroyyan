import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";

interface CustomerRowMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 160;
const MENU_HEIGHT = 132;
const GAP = 6;

export function CustomerRowMenu({
  onView,
  onEdit,
  onDelete,
}: CustomerRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < MENU_HEIGHT + GAP && rect.top > MENU_HEIGHT;

    const top = openUpward ? rect.top - MENU_HEIGHT - GAP : rect.bottom + GAP;

    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - MENU_WIDTH - 8;
    }

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-gray-500 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
        title="Aksi"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: MENU_WIDTH,
          }}
          className="bg-white rounded-xl shadow-lg border border-[rgba(140,172,214,0.35)] py-1 z-[100]"
        >
          <button
            onClick={() => {
              setOpen(false);
              onView();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Lihat
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.55)] cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        </div>
      )}
    </>
  );
}
