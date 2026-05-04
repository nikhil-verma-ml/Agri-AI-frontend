import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { auth } from '../firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const initAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && isMounted) {
          setUser(result.user);
        }
      } catch (error) {
        console.error("AuthContext: Redirect Error", error);
      } finally {
        if (isMounted) {
          unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
          });
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
