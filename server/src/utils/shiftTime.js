function parseHHMM(value) {
  const [hourRaw, minuteRaw] = String(value || "").split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

function getShiftEndDate(assignmentDate, endTime) {
  const date = new Date(assignmentDate);
  const parsed = parseHHMM(endTime);
  if (!parsed || Number.isNaN(date.getTime())) return null;
  date.setHours(parsed.hour, parsed.minute, 0, 0);
  return date;
}

function isShiftExpired(assignmentDate, endTime, now = new Date()) {
  const shiftEnd = getShiftEndDate(assignmentDate, endTime);
  if (!shiftEnd) return true;
  return now > shiftEnd;
}

module.exports = {
  isShiftExpired,
  getShiftEndDate,
};
