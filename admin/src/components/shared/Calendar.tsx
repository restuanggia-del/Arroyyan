import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  title: string;
  type: "delivery" | "payment" | "meeting";
}

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const getEventColor = (type: CalendarEvent["type"]) => {
  switch (type) {
    case "delivery":
      return "bg-[#0249e1]";
    case "payment":
      return "bg-[#ee3d5a]";
    case "meeting":
      return "bg-[#1fb262]";
    default:
      return "bg-[rgba(215,233,255,0.4)]0";
  }
};

const getLegendColor = (type: CalendarEvent["type"]) => {
  switch (type) {
    case "delivery":
      return "text-[#023dbb] clay-inset-sm border-0";
    case "payment":
      return "text-[#ee3d5a] clay-inset-red border-0";
    case "meeting":
      return "text-[#159650] clay-inset-green border-0";
    default:
      return "text-[#5b6a8f] clay-inset-sm border-0";
  }
};

const typeLabel: Record<CalendarEvent["type"], string> = {
  delivery: "Pengiriman",
  payment: "Pembayaran",
  meeting: "Rapat",
};

export function Calendar() {
  const now = new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [events] = useState<CalendarEvent[]>([
    {
      date: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      title: "Hari Ini",
      type: "meeting",
    },
  ]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const isToday = (date: number) =>
    date === now.getDate() &&
    viewMonth === now.getMonth() &&
    viewYear === now.getFullYear();

  const getEventsForDate = (date: number) =>
    events.filter(
      (e) => e.date === date && e.month === viewMonth && e.year === viewYear,
    );

  const upcomingEvents = events
    .filter(
      (e) =>
        e.month === viewMonth && e.year === viewYear && e.date >= now.getDate(),
    )
    .sort((a, b) => a.date - b.date)
    .slice(0, 3);

  const isCurrentMonth =
    viewMonth === now.getMonth() && viewYear === now.getFullYear();

  return (
    <div className="clay-raised rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#0249E1]" />
          <h3 className="text-lg font-bold text-[#10193a]">Kalender</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="mr-2 px-2.5 py-1 text-xs text-[#0249E1] font-semibold clay-raised-sm clay-pressable rounded-lg cursor-pointer"
            >
              Hari Ini
            </button>
          )}
          <button
            onClick={prevMonth}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#5b6a8f]" />
          </button>
          <span className="text-sm font-bold text-[#10193a] min-w-[140px] text-center">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[#5b6a8f]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-[#8fa4d4] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const date = idx + 1;
          const dayEvents = getEventsForDate(date);
          const today = isToday(date);
          const isPast =
            new Date(viewYear, viewMonth, date) <
            new Date(now.getFullYear(), now.getMonth(), now.getDate());

          return (
            <div
              key={date}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors ${
                today
                  ? "clay-blue text-white font-bold"
                  : isPast
                    ? "text-[#c3d3f5]"
                    : "hover:bg-[rgba(215,233,255,0.5)] text-[#10193a] cursor-pointer"
              }`}
            >
              <span className="leading-none">{date}</span>

              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${today ? "bg-white" : getEventColor(ev.type)}`}
                      title={ev.title}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-[rgba(140,172,214,0.2)]">
        <p className="text-xs font-bold text-[#5b6a8f] mb-3 uppercase tracking-wide">
          {upcomingEvents.length > 0
            ? "Event Mendatang"
            : "Tidak ada event mendatang"}
        </p>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getLegendColor(event.type)}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}
                  />
                  {typeLabel[event.type]}
                </span>
                <span className="text-xs text-[#5b6a8f]">
                  {event.date} {monthNames[event.month].slice(0, 3)}
                </span>
                <span className="text-sm text-[#10193a] font-medium">{event.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8fa4d4] italic">
            Semua berjalan lancar bulan ini
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[rgba(140,172,214,0.2)] flex items-center justify-between text-xs text-[#8fa4d4]">
        <span>
          {daysInMonth} hari · {monthNames[viewMonth]} {viewYear}
        </span>
        {isCurrentMonth && (
          <span className="text-[#0249E1] font-semibold">
            Hari ini: {now.getDate()} {monthNames[now.getMonth()]}{" "}
            {now.getFullYear()}
          </span>
        )}
      </div>
    </div>
  );
}
