import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DealerProvider } from '@/contexts/DealerContext';
import { ToastProvider } from '@/app/components/ui/ToastContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dealer Portal',
  description: 'Dealer authentication portal',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DealerProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DealerProvider>
      </body>
    </html>
  );
}