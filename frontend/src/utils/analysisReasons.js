// Backends may return a paragraph or a list, inside ai or at the top level.
export function normalizeReasons(value) {
  if (typeof value === 'string') {
    return value.split(/\r?\n+/).map(line => line.trim()).filter(Boolean)
  }
  if (Array.isArray(value)) return value.flatMap(normalizeReasons)
  return []
}

export function getAnalysisReasons(data, type) {
  const candidates = type === 'phone'
    ? [data?.ai?.reasoning, data?.ai?.reasons, data?.reasoning, data?.reasons]
    : [data?.reasons, data?.reasoning, data?.ai?.reasoning, data?.ai?.reasons]
  for (const value of candidates) {
    const reasons = normalizeReasons(value)
    if (reasons.length) return reasons
  }
  return []
}
