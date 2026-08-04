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
      return "bg-blue-500";
    case "payment":
      return "bg-red-500";
    case "meeting":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getLegendColor = (type: CalendarEvent["type"]) => {
  switch (type) {
    case "delivery":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "payment":
      return "text-red-600 bg-red-50 border-red-200";
    case "meeting":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Kalender</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="mr-2 px-2.5 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
            >
              Hari Ini
            </button>
          )}
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-2"
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
                  ? "bg-blue-600 text-white font-bold shadow-md"
                  : isPast
                    ? "text-gray-300"
                    : "hover:bg-gray-50 text-gray-900 cursor-pointer"
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

      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          {upcomingEvents.length > 0
            ? "Event Mendatang"
            : "Tidak ada event mendatang"}
        </p>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getLegendColor(event.type)}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}
                  />
                  {typeLabel[event.type]}
                </span>
                <span className="text-xs text-gray-500">
                  {event.date} {monthNames[event.month].slice(0, 3)}
                </span>
                <span className="text-sm text-gray-700">{event.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Semua berjalan lancar bulan ini
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>
          {daysInMonth} hari · {monthNames[viewMonth]} {viewYear}
        </span>
        {isCurrentMonth && (
          <span className="text-blue-500 font-medium">
            Hari ini: {now.getDate()} {monthNames[now.getMonth()]}{" "}
            {now.getFullYear()}
          </span>
        )}
      </div>
    </div>
  );
}
