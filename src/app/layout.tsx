import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar, TopBar } from '@/components/Layout';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
};

export const metadata: Metadata = {
  title: 'Ontology Platform Demo',
  description: 'Palantir Ontology Platform 交互式演示',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <TopBar />
        <Sidebar />
        <main className="app-main min-w-0 bg-gray-950 lg:ml-60">
          {children}
        </main>
      </body>
    </html>
  );
}
