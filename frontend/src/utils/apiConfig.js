import axios from 'axios';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export const publicApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const secureApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json'
  }
});
