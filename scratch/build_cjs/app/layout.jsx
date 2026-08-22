"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
require("./globals.css");
const google_1 = require("next/font/google");
const theme_provider_1 = require("@/components/theme-provider");
const sans = (0, google_1.Inter)({
    subsets: ['latin'],
    variable: '--font-sans',
    weight: ['400', '500', '600'],
    display: 'swap',
});
const mono = (0, google_1.JetBrains_Mono)({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});
exports.metadata = {
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
function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <theme_provider_1.ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </theme_provider_1.ThemeProvider>
      </body>
    </html>);
}
exports.default = RootLayout;
