import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { auth } from '../firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for redirect result first
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("AuthContext: Redirect login success", result.user.email);
          setUser(result.user);
          toast.success('Welcome back!');
        }
      } catch (error) {
        console.error("AuthContext: Redirect Error", error);
        // Don't show toast for "no redirect result" errors, only real ones
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          toast.error("Auth redirect failed. Please try again.");
        }
      }
    };

    checkRedirect();

    // 2. Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("AuthContext: Auth State Changed", currentUser?.email || 'Logged Out');
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
