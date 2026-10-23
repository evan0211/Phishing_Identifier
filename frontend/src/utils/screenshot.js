export function prepareScreenshot(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('Please select an image'))
    if (file.size > 10 * 1024 * 1024) return reject(new Error('Image must be smaller than 10 MB'))
    const image = new Image()
    const url = URL.createObjectURL(file)
    const fail = error => { URL.revokeObjectURL(url); reject(error) }
    image.onerror = () => fail(new Error('Cannot read this image'))
    image.onload = () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty image')
        const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Cannot process image')
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const src = canvas.toDataURL('image/jpeg', 0.9)
        URL.revokeObjectURL(url)
        resolve({ src, name: file.name })
      } catch (error) { fail(error) }
    }
    image.src = url
  })
}
