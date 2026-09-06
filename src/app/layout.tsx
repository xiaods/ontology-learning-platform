import type { Metadata } from 'next';
import './globals.css';
import { Sidebar, TopBar } from '@/components/Layout';

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
        <main className="ml-60 mt-14 min-h-screen bg-gray-950 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
