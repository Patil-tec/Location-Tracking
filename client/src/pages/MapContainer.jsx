import React, { useEffect, useState, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { socket } from '../socket';

// Fix the default icon issue in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A custom pulsing dot icon for the current user
const customUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to dynamically change the map view when location updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 20) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapContainer({ userContext }) {
  const { userName, otp, users: initialUsers } = userContext;
  
  const [users, setUsers] = useState(initialUsers || []);
  const [myLocation, setMyLocation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const watchIdRef = useRef(null);

  useEffect(() => {
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

    const handlePosition = (position) => {
      const { latitude, longitude } = position.coords;
      
      setMyLocation([latitude, longitude]);

      setUsers((prev) => 
        prev.map(u => u.name === userName ? { ...u, lat: latitude, lng: longitude } : u)
      );

      socket.emit('updateLocation', { lat: latitude, lng: longitude });
    };

    const handleError = (error) => {
      console.error("Error watching geolocation", error);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, { enableHighAccuracy: true });

      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }

    return () => {
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('locationUpdated');

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [userName]);

  const mapCenter = myLocation || [20, 0];
  const mapZoom = myLocation ? 16 : 2;

  const usersWithLocation = users.filter((u) => u.lat !== null && u.lng !== null);

  return (
    <div className="relative w-full h-screen bg-dark-950 overflow-hidden">
      
      {/* Floating Glass UI Panel */}
      <div className={`absolute top-4 left-4 z-20 w-80 max-w-[calc(100vw-2rem)] flex flex-col transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        
        {/* Header Glass Card */}
        <div className="glass-panel rounded-2xl p-5 mb-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-display font-bold text-white tracking-tight flex items-center">
              <span className="w-2 h-2 bg-brand-400 rounded-full mr-2 animate-pulse"></span>
              Live Tracking
            </h1>
            <div 
              className="bg-dark-800 border border-white/10 px-3 py-1 rounded-full cursor-pointer hover:bg-dark-700 transition-colors flex items-center group"
              onClick={() => navigator.clipboard.writeText(otp)}
            >
              <span className="text-xs font-mono text-brand-300 tracking-widest mr-2">{otp}</span>
              <svg className="w-3 h-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <div className="text-sm text-gray-400 font-medium">
            <span className="text-white">ID:</span> {userName}
          </div>
        </div>

        {/* Users List Glass Card */}
        <div className="glass-panel rounded-2xl flex flex-col flex-1 max-h-[60vh] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Units</h2>
            <span className="bg-brand-500/20 text-brand-300 text-xs font-bold px-2 py-0.5 rounded-full">{users.length}</span>
          </div>
          
          <ul className="p-2 space-y-1 overflow-y-auto custom-scrollbar">
            {users.map((u) => {
              const isMe = u.name === userName;
              const hasLocation = u.lat !== null && u.lng !== null;
              
              return (
                <li key={u.id || u.name} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${isMe ? 'bg-white/10 border border-white/10 shadow-lg' : 'hover:bg-white/5 border border-transparent'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-lg shadow-inner ${isMe ? 'bg-gradient-to-br from-brand-400 to-brand-600' : 'bg-gradient-to-br from-dark-600 to-dark-800 border border-white/10'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      {hasLocation && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-400 border-2 border-dark-900 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]"></span>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-100 flex items-center">
                        {u.name} 
                        {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-dark-950 bg-brand-400 px-1.5 py-0.5 rounded-md">You</span>}
                      </span>
                      <span className={`text-xs mt-0.5 ${hasLocation ? 'text-brand-300' : 'text-gray-500 animate-pulse'}`}>
                        {hasLocation ? 'Transmitting 📡' : 'Acquiring lock...'}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Toggle Sidebar Button (Mobile mainly) */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute bottom-6 right-6 z-30 w-12 h-12 bg-brand-500 text-dark-950 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-110 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isSidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          )}
        </svg>
      </button>

      {/* Fullscreen Map Area */}
      <div className="absolute inset-0 z-10 w-full h-full">
        <LeafletMap 
          center={mapCenter} 
          zoom={mapZoom} 
          className="h-full w-full outline-none focus:outline-none"
          zoomControl={false}
        >
          {/* CartoDB Dark Matter Tiles for a beautiful premium dark map */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          
          {usersWithLocation.map((u) => {
            const isMe = u.name === userName;
            return (
               <Marker 
                key={u.id || u.name} 
                position={[u.lat, u.lng]}
                icon={isMe ? customUserIcon : new L.Icon.Default()}
               >
                 <Popup className="premium-popup">
                   <div className="font-display font-bold text-white text-center pb-2 border-b border-white/10 mb-2">{u.name}</div>
                   <div className="text-[10px] text-gray-400 font-mono text-center tracking-widest uppercase">Coordinates</div>
                   <div className="text-xs text-brand-300 font-mono text-center mt-1">{u.lat.toFixed(5)}, {u.lng.toFixed(5)}</div>
                 </Popup>
               </Marker>
            );
          })}
        </LeafletMap>
      </div>

    </div>
  );
}
