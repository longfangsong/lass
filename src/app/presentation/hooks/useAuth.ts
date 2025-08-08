import { useState, useEffect } from "react";
import { useOnline } from "./useOnline";

interface User {
  email: string;
}

type AuthResponse = User | { error: string };

function isSuccess(response: AuthResponse): response is User {
  return "email" in response;
}

export function useAuth() {
  const online = useOnline();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        if (!online) {
          setUser(null);
        } else {
          try {
            const response = await fetch("/api/auth/session");
            const data: AuthResponse = await response.json();
            if (isSuccess(data)) {
              setUser(data);
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [online]);

  return {
    user,
    loading,
  };
}
