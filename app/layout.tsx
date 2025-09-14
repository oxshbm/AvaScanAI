import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AvaScanAI - Enterprise Avalanche Intelligence Platform',
  description: 'Professional-grade Avalanche C-Chain intelligence platform for developers, enterprises, and infrastructure teams. Real-time transaction analysis, gas optimization, and network insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}