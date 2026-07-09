import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Guardianes de Arequipa',
    short_name: 'Guardianes',
    description: 'Concurso inter-escolar de conocimientos sobre la Ciudad Blanca',
    start_url: '/login',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#00a8ff',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
