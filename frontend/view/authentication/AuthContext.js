import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setToken(token)
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth status", error);
    }
  };

  useEffect(() => {
    getToken();
  }, []);

  const logIn = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setIsAuthenticated(true);
      setToken(token);
    } catch (error) {
      console.error("Error logging in", error);
    }
  };

  const logOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, logIn, logOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
