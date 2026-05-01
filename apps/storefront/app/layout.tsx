import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Mağaza', template: '%s | Mağaza' },
  description: 'Online alışveriş platformu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
