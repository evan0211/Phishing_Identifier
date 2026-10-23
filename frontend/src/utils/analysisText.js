// Do not relabel claims from an unsupported source as Claude's findings.
export function phoneAnalysisText(text, type, lang = 'zh') {
  if (type !== 'phone' || typeof text !== 'string') return text
  if (!/核心\s*辨識模型|gogolook|core\s+recognition\s+model/i.test(text)) return text
  return lang === 'en'
    ? 'This statement cites a source that does not support phone verification and cannot be used for this analysis.'
    : '此段內容引用了不支援電話驗證的來源，無法作為本次判斷依據。'
}
