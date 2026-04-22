import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface CalendarEvent {
  date: number;
  title: string;
  type: "delivery" | "payment" | "meeting";
}

const events: CalendarEvent[] = [
  { date: 21, title: "Hari Ini", type: "meeting" },
  { date: 23, title: "Pengiriman ke Dist. A", type: "delivery" },
  { date: 25, title: "Pembayaran Jatuh Tempo", type: "payment" },
  { date: 28, title: "Rapat Evaluasi", type: "meeting" },
];

export function Calendar() {
  const [currentDate] = useState(new Date(2026, 3, 21)); // April 21, 2026

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

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

  const getEventForDate = (date: number) => {
    return events.find((e) => e.date === date);
  };

  const getEventColor = (type: string) => {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Kalender</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const date = index + 1;
          const event = getEventForDate(date);
          const isToday = date === 21;

          return (
            <div
              key={date}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                isToday
                  ? "bg-blue-600 text-white font-bold"
                  : "hover:bg-gray-100 text-gray-900"
              }`}
            >
              <span>{date}</span>
              {event && (
                <div
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}
                  title={event.title}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-3">
          Event Mendatang
        </p>
        <div className="space-y-2">
          {events
            .filter((e) => e.date >= 21)
            .slice(0, 3)
            .map((event, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${getEventColor(event.type)}`}
                />
                <span className="text-gray-600">{event.date} Apr</span>
                <span className="text-gray-900">{event.title}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
