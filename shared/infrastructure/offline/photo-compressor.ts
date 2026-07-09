/**
 * Comprime una imagen a WebP usando un canvas HTML5.
 * Reduce fotos de 5-10 MB a ~200-500 KB.
 *
 * @param file - Archivo de imagen original (File or Blob)
 * @param maxWidth - Ancho máximo (mantiene aspect ratio)
 * @param quality - Calidad WebP (0.0 - 1.0)
 * @returns Blob en formato WebP
 */
export function compressImage(
  file: File | Blob,
  maxWidth = 1200,
  quality = 0.6,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calcular dimensiones manteniendo aspect ratio
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            // Fallback: si no soporta WebP, devolver el original
            resolve(file)
          }
        },
        'image/webp',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen'))
    }

    img.src = url
  })
}

/**
 * Estima si el navegador soporta WebP (para decidir si comprimir).
 * La mayoría de navegadores modernos lo soportan.
 */
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}
