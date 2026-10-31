import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PotionPulse — Inventory Intelligence Platform',
  description: 'Predict. Manage. Thrive. Multi-tenant inventory intelligence for potion shops and small businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink text-paleLavender antialiased selection:bg-potionPurple selection:text-white">
        {children}
      </body>
    </html>
  );
}

