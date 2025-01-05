import { useState, useEffect } from 'react';

interface User {
  email: string;
}

type AuthResponse = User | {error: string};

function isSuccess(response: AuthResponse): response is User {
  return 'email' in response;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data: AuthResponse = await response.json();
      if (isSuccess(data)) {
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading
  };
} 