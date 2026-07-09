export default function parseDate(dateString: any): Date {
  let date: Date;
  if (dateString) {
    if (typeof dateString === "string" || typeof dateString === "number") {
      const d = new Date(dateString);
      date = isNaN(d.getTime()) ? new Date() : d;
    } else {
      date = new Date();
    }
  } else {
    date = new Date();
  }
  return date;
}