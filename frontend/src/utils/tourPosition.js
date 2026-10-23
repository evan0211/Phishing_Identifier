// Choose a position beside the padded spotlight, rather than clamping a
// requested side back over the target when that side has no room.
export function placeTourCard(rect, card, viewport, preferred) {
  const gap = 16
  const width = Math.min(card.width, viewport.width - gap * 2)
  const height = Math.min(card.height, viewport.height - gap * 2)
  const clamp = (v, max) => Math.max(gap, Math.min(v, max))
  const x = clamp(rect.left + (rect.right - rect.left - width) / 2, viewport.width - width - gap)
  const y = clamp(rect.top + (rect.bottom - rect.top - height) / 2, viewport.height - height - gap)
  const options = {
    right: { left: rect.right + gap, top: y, room: viewport.width - rect.right - gap * 2, need: width },
    left: { left: rect.left - width - gap, top: y, room: rect.left - gap * 2, need: width },
    bottom: { left: x, top: rect.bottom + gap, room: viewport.height - rect.bottom - gap * 2, need: height },
    top: { left: x, top: rect.top - height - gap, room: rect.top - gap * 2, need: height },
  }
  const order = [...new Set([preferred, 'bottom', 'top', 'right', 'left'])].filter(key => options[key])
  for (const key of order) {
    const option = options[key]
    if (option.room >= option.need) return { left: option.left, top: option.top, width, maxHeight: height }
  }
  // Small screens: use the larger vertical space and scroll the card's text.
  const below = options.bottom.room >= options.top.room
  const space = Math.max(options.bottom.room, options.top.room)
  const maxHeight = Math.min(height, Math.max(96, space))
  return {
    left: x,
    top: below ? clamp(rect.bottom + gap, viewport.height - maxHeight - gap) : gap,
    width, maxHeight,
  }
}
