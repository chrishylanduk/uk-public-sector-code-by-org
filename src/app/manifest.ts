export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UK Public Sector Code by Organisation',
    short_name: 'UK Public Sector Code',
    description: 'Explore the open source code published by UK public sector organisations.',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#9a3412',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
    ],
  };
}
