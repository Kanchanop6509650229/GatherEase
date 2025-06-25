import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadCalendarEvent(date: Date, time: string) {
  const TIME_MAP: Record<string, string> = {
    "Any Time": "12:00",
    "Morning (9am-12pm)": "09:00",
    "Afternoon (12pm-5pm)": "12:00",
    "Evening (5pm-9pm)": "17:00",
    "Late Night (9pm+)": "21:00",
  };

  const [hours, minutes] = (TIME_MAP[time] || "12:00").split(":");
  const start = new Date(date);
  start.setHours(Number(hours), Number(minutes), 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const formatICS = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTAMP:${formatICS(new Date())}`,
    `DTSTART:${formatICS(start)}`,
    `DTEND:${formatICS(end)}`,
    "SUMMARY:GatherEase Event",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "event.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
