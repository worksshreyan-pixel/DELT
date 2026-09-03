import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DELT — Secure Digital Deals, Delivery & Payments',
  description:
    'DELT is a secure workspace for freelancers, creators and agencies to communicate, negotiate, deliver digital work and get paid in one place.',
  keywords: [
    'DELT',
    'DELT deals',
    'secure digital deals',
    'freelancer client deals',
    'digital delivery platform',
    'creator platform',
    'secure file delivery',
    'freelancer payments',
  ],
  metadataBase: new URL('https://www.delt.website'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DELT — Secure Digital Deals, Delivery & Payments',
    description:
      'DELT is a secure workspace for freelancers, creators and agencies to communicate, negotiate, deliver digital work and get paid in one place.',
    type: 'website',
    siteName: 'DELT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DELT — Secure Digital Deals, Delivery & Payments',
    description:
      'DELT is a secure workspace for freelancers, creators and agencies to communicate, negotiate, deliver digital work and get paid in one place.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.delt.website/#organization',
      name: 'DELT',
      url: 'https://www.delt.website',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.delt.website/#website',
      url: 'https://www.delt.website',
      name: 'DELT',
      publisher: {
        '@id': 'https://www.delt.website/#organization',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
