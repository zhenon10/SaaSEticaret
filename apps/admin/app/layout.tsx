import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Yönetim Paneli', template: '%s | Admin' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
