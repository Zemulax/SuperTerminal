function parseDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const numericValue = Number(trimmed);
  const date = Number.isFinite(numericValue)
    ? new Date(numericValue)
    : new Date(trimmed);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatDateSafe(value?: string | null): string {
  const date = parseDate(value);
  if (!date) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

export function formatDurationSafe(
  start?: string | null,
  end?: string | null,
): string {
  const startDate = parseDate(start);
  if (!startDate) {
    return "Unknown duration";
  }

  const endDate = parseDate(end);
  if (!endDate) {
    return "Active";
  }

  const seconds = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / 1000),
  );

  if (!Number.isFinite(seconds)) {
    return "Unknown duration";
  }

  if (seconds < 5) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
