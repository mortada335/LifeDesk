import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'LifeDesk — Never Forget What Matters',
  description:
    'Track personal obligations, recurring bills, subscriptions, appointments, and expiring documents with smart deadline alerts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
