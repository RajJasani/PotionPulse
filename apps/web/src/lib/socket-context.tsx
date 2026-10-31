'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastEvent: { type: string; payload: any; timestamp: string } | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  lastEvent: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { activeTenant, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any; timestamp: string } | null>(null);

  useEffect(() => {
    if (!activeTenant?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const host = process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
      : 'http://localhost:4000';

    const s = io(`${host}/realtime`, {
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
      reconnectionAttempts: 5,
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('tenant:join', { tenantId: activeTenant.id });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('inventory:updated', (payload) => {
      setLastEvent({
        type: 'inventory:updated',
        payload,
        timestamp: new Date().toISOString(),
      });
    });

    s.on('sale:completed', (payload) => {
      setLastEvent({
        type: 'sale:completed',
        payload,
        timestamp: new Date().toISOString(),
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [activeTenant?.id, accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastEvent }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
