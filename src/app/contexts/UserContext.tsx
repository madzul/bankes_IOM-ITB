"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id && !userName) {
        try {
          const response = await fetch(`/api/users`);
          if (response.ok) {
            const user = await response.json();
            setUserName(user.name);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (!session?.user?.id) {
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, [session, userName]);

  return (
    <UserContext.Provider value={{ userName, setUserName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};