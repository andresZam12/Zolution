/**
 * Times are always shown to people in 12-hour format, e.g. "3:05 PM".
 */

export function formatTime12h(value: string | Date): string {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export interface Time12h {
  hour: number;
  minute: number;
  period: "AM" | "PM";
}

/** Split a 24-hour "HH:MM" value into its 12-hour parts. */
export function toTime12h(value: string): Time12h {
  const [hours, minute] = value.split(":").map(Number);
  return { hour: hours % 12 || 12, minute, period: hours >= 12 ? "PM" : "AM" };
}

/** Build the 24-hour "HH:MM" value that the API expects. */
export function fromTime12h({ hour, minute, period }: Time12h): string {
  const hours = (hour % 12) + (period === "PM" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
