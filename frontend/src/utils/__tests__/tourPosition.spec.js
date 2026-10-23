import { expect, it } from 'vitest'
import { placeTourCard } from '../tourPosition.js'

function overlaps(card, rect) {
  return card.left < rect.right && card.left + card.width > rect.left && card.top < rect.bottom && card.top + card.maxHeight > rect.top
}
it('chooses another side when the requested side cannot fit', () => {
  const rect = { left: 500, right: 800, top: 40, bottom: 140 }
  const card = placeTourCard(rect, { width: 340, height: 300 }, { width: 1280, height: 720 }, 'top')
  expect(card.top).toBeGreaterThan(rect.bottom)
  expect(overlaps(card, rect)).toBe(false)
})
it('avoids clamping a right-side card back over a target near the screen edge', () => {
  const rect = { left: 950, right: 1260, top: 80, bottom: 430 }
  const card = placeTourCard(rect, { width: 340, height: 300 }, { width: 1280, height: 720 }, 'right')
  expect(card.left + card.width).toBeLessThan(rect.left)
  expect(overlaps(card, rect)).toBe(false)
})
it('constrains the card height on a narrow phone without covering the target', () => {
  const rect = { left: 20, right: 370, top: 200, bottom: 400 }
  const card = placeTourCard(rect, { width: 340, height: 400 }, { width: 390, height: 720 }, 'top')
  expect(card.top + card.maxHeight).toBeLessThanOrEqual(704)
  expect(card.maxHeight).toBeLessThan(400)
  expect(overlaps(card, rect)).toBe(false)
})
