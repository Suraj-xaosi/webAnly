export default function parseTime(timeSpent: unknown): number {
  let newtimeSpent = 0;
  if (typeof timeSpent === "number") {
    newtimeSpent = timeSpent;
  } else if (typeof timeSpent === "string" && timeSpent.trim() !== "") {
    const parsed = Number(timeSpent);
    newtimeSpent = Number.isNaN(parsed) ? 0 : parsed;
  }
  return newtimeSpent;
}