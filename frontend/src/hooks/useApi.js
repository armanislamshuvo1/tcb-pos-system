'use client';

import { useEffect } from 'react';
import { publicApi, secureApi } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';

export const useAxiosPublic = () => {
  return publicApi;
};

export const useAxiosSecure = () => {
  const { token, lockTerminal } = useAuth();

  useEffect(() => {
    const requestIntercept = secureApi.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = secureApi.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('[Session] Received 401 Unauthorized - redirecting to login');
          lockTerminal?.();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      secureApi.interceptors.request.eject(requestIntercept);
      secureApi.interceptors.response.eject(responseIntercept);
    };
  }, [token, lockTerminal]);

  return secureApi;
};
