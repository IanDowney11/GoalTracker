import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProviderWrapper } from './providers';

export const metadata: Metadata = {
  title: 'GoalTracker',
  description: 'Personal health goal tracking PWA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GoalTracker',
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
      </head>
      <body className="bg-gray-950 text-white antialiased">
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
