export function normalizeSeedRiskDescription(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}
