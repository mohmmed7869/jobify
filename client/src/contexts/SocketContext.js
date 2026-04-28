import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Auto-detect: localhost في التطوير، Render في الإنتاج
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const backendUrl = process.env.REACT_APP_SOCKET_URL
        || process.env.REACT_APP_API_URL
        || (isLocalhost ? 'http://localhost:5000' : 'https://jobify-backend-bnbg.onrender.com');
      const newSocket = io(backendUrl, {
        query: { userId: user._id }
      });

      setSocket(newSocket);

      // الاستماع للأحداث
      newSocket.on('connect', () => {
        console.log('متصل بالخادم');
      });

      newSocket.on('disconnect', () => {
        console.log('منقطع عن الخادم');
      });

      newSocket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user]);

  const value = {
    socket,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};