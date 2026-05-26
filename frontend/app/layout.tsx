import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { GlobalChatWidget } from '@/components/GlobalChatWidget';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'AI Sales Forecasting & Business Analytics Suite',
  description: 'Forecast the Future with AI. Zero-training LLM advantage for business analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
        <GlobalChatWidget />
      </body>
    </html>
  );
}

