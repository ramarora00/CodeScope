import { useState, useEffect } from 'react';
import { subscribeToAuthChanges } from '../../../auth/authService';
import { auth } from '../../../auth/firebase';

export function useAuth() {
  const [user, setUser] = useState(() => auth?.currentUser || null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return { user };
}
