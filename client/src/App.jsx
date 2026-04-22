import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import MapContainer from './pages/MapContainer';

// We manage a simple state here or in Context. 
// For simplicity, we can pass it as props, or we can use a small layout/wrapper.
function App() {
  const [userContext, setUserContext] = useState({
    userName: '',
    otp: '',
    roomId: '',
    users: [] // Initial users in the group
  });

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Routes>
          <Route 
            path="/" 
            element={<Home setUserContext={setUserContext} />} 
          />
          <Route 
            path="/map" 
            element={
              userContext.otp ? (
                <MapContainer userContext={userContext} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
