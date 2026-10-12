export interface IcsEvent {
  date: string;
  title: string;
  description: string;
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** RFC 5545: fold at 75 octets. */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(bytes.length, start + limit);
    while (end > start && (bytes[end] ?? 0) >= 0x80 && (bytes[end] ?? 0) < 0xc0) end -= 1;
    if (end === start) end = Math.min(bytes.length, start + limit);
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    limit = 74;
  }
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join("\r\n");
}

function dateStamp(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return date.replace(/-/g, "");
}

export function buildIcsCalendar(input: {
  calendarName: string;
  events: IcsEvent[];
  emptyNote?: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bandi AI Assistant//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldIcsLine(`X-WR-CALNAME:${escapeIcs(input.calendarName)}`),
  ];
  const events = input.events.filter((event) => dateStamp(event.date));
  const usable = events.length > 0 ? events : input.emptyNote ? [noteEvent(input.emptyNote)] : [];
  usable.forEach((event, index) => {
    const stamp = dateStamp(event.date);
    if (!stamp) return;
    const end = nextDay(stamp);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${stamp}-${index}@bandi-ai-assistant`,
      `DTSTAMP:${stamp}T090000Z`,
      `DTSTART;VALUE=DATE:${stamp}`,
      `DTEND;VALUE=DATE:${end}`,
      foldIcsLine(`SUMMARY:${escapeIcs(event.title)}`),
      foldIcsLine(`DESCRIPTION:${escapeIcs(event.description)}`),
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function noteEvent(note: string): IcsEvent {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    date,
    title: "Nessuna scadenza certa",
    description: note,
  };
}

function nextDay(stamp: string): string {
  const year = Number(stamp.slice(0, 4));
  const month = Number(stamp.slice(4, 6));
  const day = Number(stamp.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}
