import { useEffect, useRef, useState } from "react";
import { MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";

interface CustomerRowMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerRowMenu({
  onView,
  onEdit,
  onDelete,
}: CustomerRowMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const runAndClose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-gray-500 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
        title="Aksi"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[rgba(140,172,214,0.35)] py-1 z-10">
          <button
            onClick={() => runAndClose(onView)}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Lihat
          </button>
          <button
            onClick={() => runAndClose(onEdit)}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.55)] cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => runAndClose(onDelete)}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}
