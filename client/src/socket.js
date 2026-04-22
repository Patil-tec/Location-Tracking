import { io } from 'socket.io-client';

// Defaults to localhost for development, but in production we can define the VITE_BACKEND_URL env var
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3001' : '/');

export const socket = io(URL, {
  autoConnect: false, // We'll connect manually when needed
});
