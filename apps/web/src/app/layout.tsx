import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SocketProvider } from '@/lib/socket-context';

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
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
