export default function parseTime(timeSpent: any): number {
  let newtimeSpent = 0;
  if (typeof timeSpent === "number") {
    newtimeSpent = timeSpent;
  } else if (typeof timeSpent === "string" && timeSpent.trim() !== "") {
    const parsed = Number(timeSpent);
    newtimeSpent = isNaN(parsed) ? 0 : parsed;
  }
  return newtimeSpent;
}