import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
var sans = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    weight: ['400', '500', '600'],
    display: 'swap',
});
var mono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});
export var metadata = {
    title: 'DELT — The workspace where digital work gets done',
    description: 'DELT brings client communication, negotiation, delivery and payment into one secure workspace for freelancers, creators and agencies.',
    metadataBase: new URL('https://delt.app'),
    openGraph: {
        title: 'DELT — The workspace where digital work gets done',
        description: 'Create private client transactions. Discuss, negotiate, deliver and get paid — all from one professional workspace.',
        type: 'website',
        siteName: 'DELT',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DELT — The workspace where digital work gets done',
        description: 'Create private client transactions. Discuss, negotiate, deliver and get paid — all from one professional workspace.',
    },
};
export default function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="en" suppressHydrationWarning>
      <body className={"".concat(sans.variable, " ").concat(mono.variable, " font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>);
}
