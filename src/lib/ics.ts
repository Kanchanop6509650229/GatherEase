export function generateEventICS(
  title: string,
  start: Date,
  durationHours: number,
  location: string
): string {
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const format = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
