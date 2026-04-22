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
      // Don't disconnect here because we use it in the next route
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
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 space-y-8 animate-fade-in-up">
        
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-brand-500 text-white flex items-center justify-center rounded-full mb-4 shadow-lg shadow-brand-500/30">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">GeoTrack</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Real-time group location sharing</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
            <input
              id="name"
              type="text"
              required
              className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="e.g. John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create New Group'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400 font-medium tracking-wide text-xs uppercase">Or Join Existing</span>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                maxLength="6"
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-center tracking-widest font-mono text-lg transition-all"
                placeholder="000000"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <button
              onClick={handleJoinGroup}
              disabled={loading}
              className="flex-none py-3 px-6 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
            >
              Join Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
