import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zapcart Agent',
  description: 'AI-powered content and campaign workspace',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
