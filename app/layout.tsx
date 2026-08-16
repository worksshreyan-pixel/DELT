import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cal = localFont({
  src: '../public/fonts/CalSans-SemiBold.woff2',
  variable: '--font-cal',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DELT — The workspace where digital work gets done',
  description:
    'DELT brings client communication, negotiation, delivery and payment into one secure workspace for freelancers, creators and agencies.',
  metadataBase: new URL('https://delt.app'),
  openGraph: {
    title: 'DELT — The workspace where digital work gets done',
    description:
      'Create private client transactions. Discuss, negotiate, deliver and get paid — all from one professional workspace.',
    type: 'website',
    siteName: 'DELT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DELT — The workspace where digital work gets done',
    description:
      'Create private client transactions. Discuss, negotiate, deliver and get paid — all from one professional workspace.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cal.variable} ${mono.variable} font-sans antialiased`}
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
