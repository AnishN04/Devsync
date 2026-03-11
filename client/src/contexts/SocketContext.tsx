import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (accessToken) {
      const newSocket = io('http://localhost:5000', {
        auth: { token: accessToken },
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        setIsConnected(true);
      });
      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });
      newSocket.on('connect_error', (err) => {
        console.error('⚠️ Socket connect error:', err.message);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Closing socket connection...');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.disconnect(); // Explicitly disconnect
      };
    } else {
      setSocket(null);
      setIsConnected(false);
    }
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
