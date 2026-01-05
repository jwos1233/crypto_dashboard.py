import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Crypto Macro Overlay | Systematic Crypto Allocation',
  description:
    'Systematic crypto portfolio allocation based on macroeconomic regime detection. Get real-time signals for optimal crypto positioning.',
  keywords: ['crypto', 'macro', 'trading signals', 'portfolio allocation', 'bitcoin', 'ethereum'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
