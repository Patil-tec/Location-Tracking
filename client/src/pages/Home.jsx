import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Home({ setUserContext }) {
  const [userName, setUserName] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    return () => {
      socket.off('connect');
    };
  }, []);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setLoading(true);

    socket.emit('createGroup', { userName }, (response) => {
      setLoading(false);
      if (response.success) {
        setUserContext({
          userName,
          otp: response.otp,
          roomId: response.roomId,
          users: response.users
        });
        navigate('/map');
      } else {
        setError(response.message || 'Failed to create group');
      }
    });
  };

  const handleJoinGroup = (e) => {
    e.preventDefault();
    if (!userName.trim() || !otpInput.trim()) {
      setError('Please enter both name and OTP');
      return;
    }
    if (otpInput.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    
    setError('');
    setLoading(true);

    socket.emit('joinGroup', { userName, otp: otpInput }, (response) => {
      setLoading(false);
      if (response.success) {
        setUserContext({
          userName,
          otp: otpInput,
          roomId: response.roomId,
          users: response.users
        });
        navigate('/map');
      } else {
        setError(response.message || 'Failed to join group');
      }
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-dark-950 overflow-hidden font-sans p-4">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>

      {/* Main Glass Card */}
      <div className="relative z-10 max-w-md w-full glass-panel rounded-3xl p-8 space-y-8 animate-fade-in-up">
        
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-brand-600 to-brand-300 text-dark-950 flex items-center justify-center rounded-2xl mb-6 shadow-[0_0_30px_rgba(20,184,166,0.3)] transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight">GeoTrack</h2>
          <p className="mt-2 text-sm text-gray-400 font-medium">Real-time group location sharing</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center font-medium border border-red-500/20 backdrop-blur-sm animate-fade-in-up">
            {error}
          </div>
        )}

        <form className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Your Alias</label>
            <input
              id="name"
              type="text"
              required
              className="block w-full px-5 py-4 bg-dark-800/50 border border-white/5 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all shadow-inner"
              placeholder="e.g. Maverick"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 rounded-2xl text-sm font-bold text-dark-950 bg-brand-400 hover:bg-brand-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-brand-500 transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? 'Initializing Secure Link...' : 'Create New Group'}
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-900 text-gray-500 font-medium tracking-widest text-[10px] uppercase rounded-full">Or Join Existing</span>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                maxLength="6"
                className="block w-full px-5 py-4 bg-dark-800/50 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 text-center tracking-[0.5em] font-mono text-xl transition-all shadow-inner uppercase"
                placeholder="000000"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <button
              onClick={handleJoinGroup}
              disabled={loading}
              className="flex-none py-4 px-8 rounded-2xl text-sm font-bold text-white bg-dark-800 hover:bg-dark-700 border border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-gray-500 transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
