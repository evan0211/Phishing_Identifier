import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { prepareScreenshot } from '../screenshot.js'
let context
let canvas
beforeEach(() => {
  context = { fillRect: vi.fn(), drawImage: vi.fn() }
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() })
  vi.stubGlobal('Image', class {
    naturalWidth = 4096
    naturalHeight = 2048
    set src(value) { queueMicrotask(() => this.onload()) }
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () { canvas = this; return context })
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,test')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('resizes large screenshots and paints transparency white before encoding', async () => {
  const file = new File(['test'], 'shot.png', { type: 'image/png' })
  await expect(prepareScreenshot(file)).resolves.toEqual({ name: 'shot.png', src: 'data:image/jpeg;base64,test' })
  expect([canvas.width, canvas.height]).toEqual([2048, 1024])
  expect(context.fillStyle).toBe('#fff')
  expect(context.fillRect).toHaveBeenCalledWith(0, 0, 2048, 1024)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
})
it('rejects unsupported or oversized files before decoding', async () => {
  await expect(prepareScreenshot({ type: 'text/plain', size: 1 })).rejects.toThrow()
  await expect(prepareScreenshot({ type: 'image/png', size: 11 * 1024 * 1024 })).rejects.toThrow('10 MB')
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})
it('releases the image URL when decoding fails', async () => {
  vi.stubGlobal('Image', class { set src(value) { queueMicrotask(() => this.onerror()) } })
  await expect(prepareScreenshot({ type: 'image/png', size: 1 })).rejects.toThrow('Cannot read')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
})
