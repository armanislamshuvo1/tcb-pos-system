'use client';

import { useEffect } from 'react';
import { publicApi, secureApi } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';

export const useAxiosPublic = () => {
  return publicApi;
};

export const useAxiosSecure = () => {
  const { token } = useAuth();

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

    return () => {
      secureApi.interceptors.request.eject(requestIntercept);
    };
  }, [token]);

  return secureApi;
};
