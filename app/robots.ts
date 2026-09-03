import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/how-it-works', '/pricing', '/security'],
      disallow: [
        '/dashboard/',
        '/deals/',
        '/deal/',
        '/settings/',
        '/api/',
        '/storage/',
        '/login',
        '/signup',
      ],
    },
    sitemap: 'https://www.delt.website/sitemap.xml',
  };
}
