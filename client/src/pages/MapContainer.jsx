import React, { useEffect, useState, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { socket } from '../socket';

// Fix the default icon issue in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A custom pulsing dot icon for the current user (optional enhancement)
const customUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapContainer({ userContext }) {
  const { userName, otp, users: initialUsers } = userContext;
  
  // Store all users in the room
  const [users, setUsers] = useState(initialUsers || []);
  
  // Track my own location locally so we can pan the map to it if needed
  const [myLocation, setMyLocation] = useState(null);

  // Watch for Geolocation ID
  const watchIdRef = useRef(null);

  useEffect(() => {
    // 1. Setup socket event listeners
    socket.on('userJoined', ({ users: newUsersList }) => {
      setUsers(newUsersList);
    });

    socket.on('userLeft', ({ id, users: remainingUsers }) => {
      setUsers(remainingUsers);
    });

    socket.on('locationUpdated', ({ id, lat, lng }) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === id ? { ...u, lat, lng } : u))
      );
    });

    // 2. Start watching Geolocation
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update local state for map centering (if needed)
          setMyLocation({ lat: latitude, lng: longitude });

          // Update my own user object in the list
          setUsers((prev) => 
            prev.map(u => u.name === userName ? { ...u, lat: latitude, lng: longitude } : u)
          );

          // Emit to server
          socket.emit('updateLocation', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error watching geolocation", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }

    // Cleanup
    return () => {
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('locationUpdated');

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [userName]);

  const mapCenter = myLocation || [20, 0]; // Default to some view if no location yet
  const mapZoom = myLocation ? 15 : 2;

  // Filter out users who haven't emitted a location yet
  const usersWithLocation = users.filter((u) => u.lat !== null && u.lng !== null);

  return (
    <div className="relative w-full h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar Overlay (Mobile) / Fixed (Desktop) */}
      <div className="md:w-80 w-full bg-white bg-opacity-95 md:h-full z-20 shadow-xl flex flex-col absolute md:relative bottom-0 md:bottom-auto max-h-[50vh] md:max-h-full transition-transform pb-safe">
        
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Group Track</h1>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide cursor-pointer" onClick={() => navigator.clipboard.writeText(otp)}>OTP: {otp}</span>
            </div>
          </div>
          <div className="bg-brand-50 rounded-lg p-3 text-sm text-brand-900 font-medium border border-brand-100 shadow-sm flex items-center mb-1">
             <span className="text-xl mr-2" aria-hidden="true">👋</span> Hello, {userName}
          </div>
          <p className="text-xs text-gray-500 mt-2">Share the OTP with others to let them join.</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Group Members ({users.length})</h2>
          <ul className="space-y-3">
            {users.map((u) => {
              const isMe = u.name === userName;
              const hasLocation = u.lat !== null && u.lng !== null;
              return (
                <li key={u.id || u.name} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isMe ? 'bg-gray-50 border border-gray-100' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${isMe ? 'bg-red-500' : 'bg-brand-500'}`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">
                        {u.name} {isMe && <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full ml-1">You</span>}
                      </span>
                      <span className="text-xs text-brand-600 font-medium">
                        {hasLocation ? 'Active ✨' : 'Waiting for location...'}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full z-10 w-full relative outline-none focus:outline-none">
        
        {/* Only render map if we have browser support since leaflet needs window object. */}
        <LeafletMap 
          center={mapCenter} 
          zoom={mapZoom} 
          className="h-full w-full rounded-none md:rounded-l-2xl shadow-inner"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render markers for users who have a location */}
          {usersWithLocation.map((u) => {
            const isMe = u.name === userName;
            return (
               <Marker 
                key={u.id || u.name} 
                position={[u.lat, u.lng]}
                icon={isMe ? customUserIcon : new L.Icon.Default()}
               >
                 <Popup>
                   <div className="font-semibold text-center pb-1 border-b border-gray-100 mb-1">{u.name}'s Location</div>
                   <div className="text-xs text-gray-500 text-center">Latitude: {u.lat.toFixed(4)}</div>
                   <div className="text-xs text-gray-500 text-center">Longitude: {u.lng.toFixed(4)}</div>
                 </Popup>
               </Marker>
            );
          })}
        </LeafletMap>
      </div>

    </div>
  );
}
