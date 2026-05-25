import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation2, Users, AlertTriangle, Crosshair, X, Bell, Search, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { OperationType, handleFirestoreError } from '../lib/firebase';
import { navState } from '../lib/navState';
import { useRealWeather } from '../lib/weather';

// User marker icon
const userIcon = L.divIcon({
  className: 'user-marker',
  html: '<div class="w-5 h-5 bg-brand-blue rounded-full border-2 border-white shadow-[0_0_15px_rgba(14,165,233,0.6)]"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper to keep map centered gracefully when a vehicle is followed
function FollowCam({ target, userPos }: { target: Vehicle | null, userPos: { lat: number, lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [target, map]);
  
  return null;
}

// Markers
const createVehicleIcon = (type: string, isdelayed: boolean, heading: number) => {
  const color = type === 'bus' ? '#0ea5e9' : '#10b981'; // brand-blue or brand-green
  const glowStr = isdelayed ? '0 0 15px rgba(249,115,22,0.4)' : `0 4px 10px rgba(0,0,0,0.1)`;
  const borderCol = isdelayed ? '#f97316' : '#ffffff';
  
  return L.divIcon({
    className: 'custom-vehicle-marker transition-all duration-[3000ms] ease-linear',
    html: `
      <div style="
        width: 38px; 
        height: 38px; 
        background: ${color}; 
        border-radius: 50%;
        border: 3px solid ${borderCol};
        box-shadow: ${glowStr};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transform: rotate(${heading}deg);
        transition: transform 1s ease-in-out;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation-2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

export function LiveMapScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(navState.getSelectedVehicleId());
  const [userPos, setUserPos] = useState<{ lat: number, lng: number } | null>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  useEffect(() => {
    return navState.subscribe(() => {
      setSelectedVehicleId(navState.getSelectedVehicleId());
    });
  }, []);

  const handleSetSelectedVehicleId = (id: string | null) => {
    navState.setSelectedVehicleId(id);
  };

  useEffect(() => {
    // Listen to real-time vehicles
    const q = query(collection(db, 'vehicles'), where('type', 'in', ['bus', 'ferry']));
    const unsub = onSnapshot(q, (snap) => {
      const vData: Vehicle[] = [];
      snap.forEach(doc => {
        const v = { id: doc.id, ...doc.data() } as Vehicle;
        // ONLY show real documented driver trips. Ignore mock or placeholder entries.
        if (v.status !== 'inactive' && v.driverId) {
          vData.push(v);
        }
      });
      setVehicles(vData);
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn("Location error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (userPos && mapRef) {
      mapRef.flyTo([userPos.lat, userPos.lng], 16);
    }
  }, [userPos, mapRef]);

  const nearbyVehicles = vehicles.filter(v => {
    if (v.lat === 0 && v.lng === 0) return true; // Include vehicles waiting for GPS lock
    return true; // Show all vehicles for now so tracking is globally visible
  });

  const selectedVehicle = nearbyVehicles.find(v => v.id === selectedVehicleId) || null;
  const weather = useRealWeather();
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  useEffect(() => {
    if (mapRef && selectedVehicle && vehicles.length > 0) {
      mapRef.flyTo([selectedVehicle.lat, selectedVehicle.lng], 15, { animate: true, duration: 1.5 });
    }
  }, [mapRef, selectedVehicleId]); // deliberately excluding selectedVehicle Object to avoid loop, and capturing ID instead

  const [mapStyle, setMapStyle] = useState<'positron' | 'voyager'>('positron');

  return (
    <div className="w-full h-full relative bg-[#f8fafc] flex flex-col font-sans">
      <AnimatePresence>
        {weather.alert && !isAlertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -50, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -50, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 w-full bg-orange-50 backdrop-blur-md border-b border-orange-200 overflow-hidden z-[1000] rounded-b-3xl"
          >
            <div className="flex items-start gap-3 p-4 pt-6 max-w-7xl mx-auto">
              <div className="mt-0.5 max-w-fit rounded-full bg-brand-orange/20 p-2 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <AlertTriangle className="w-5 h-5 text-brand-orange" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight font-display">Transit Impact Expected</h4>
                <p className="text-sm text-slate-600 mt-0.5 leading-snug font-medium">{weather.alert}</p>
              </div>
              <button 
                onClick={() => setIsAlertDismissed(true)}
                className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-slate-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 relative">
        <MapContainer 
          center={[9.9816, 76.2999]} 
          zoom={14} 
          zoomControl={false}
          className="w-full h-full"
          attributionControl={false}
          ref={setMapRef}
        >
        <TileLayer
          url={`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`}
        />
        
        {nearbyVehicles.map(v => (
          <Marker 
            key={v.id} 
            position={[v.lat, v.lng]} 
            icon={createVehicleIcon(v.type, v.status === 'delayed', v.heading)}
            eventHandlers={{
              click: () => handleSetSelectedVehicleId(v.id)
            }}
            zIndexOffset={v.id === selectedVehicleId ? 1000 : 0}
          >
            <Popup closeButton={false} className="custom-popup border-0 shadow-lg !rounded-xl">
              <div className="p-2 flex flex-col gap-1 min-w-[150px]">
                <div className="font-black text-sm font-display truncate text-slate-900">{v.routeName}</div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>{v.speed} km/h</span>
                  {userPos && (
                    <span className="text-brand-orange">
                      {(() => {
                        const R = 6371e3;
                        const dLat = (userPos.lat - v.lat) * Math.PI / 180;
                        const dLon = (userPos.lng - v.lng) * Math.PI / 180;
                        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(v.lat * Math.PI / 180) * Math.cos(userPos.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const distanceMeters = R * c;
                        const speedKmh = v.speed || 20;
                        const speedMs = speedKmh * (1000 / 3600);
                        const etaMins = Math.max(1, Math.round((distanceMeters / speedMs) / 60));
                        return etaMins > 60 ? '>1 hr' : `ETA: ${etaMins} Min`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userPos && (
          <>
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} zIndexOffset={500} />
            <Circle 
              center={[userPos.lat, userPos.lng]} 
              radius={100} 
              pathOptions={{ fillColor: '#0ea5e9', fillOpacity: 0.1, stroke: false }} 
            />
          </>
        )}

        <FollowCam target={selectedVehicle} userPos={userPos} />
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[400] flex flex-col gap-4">
        <button 
          onClick={handleLocate}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-95 transition-transform"
        >
          <Crosshair className="w-5 h-5 text-brand-blue" />
        </button>
      </div>

      {/* Floating Pill - Top Center */}
      <div className="absolute top-12 left-4 right-4 z-[400] pointer-events-none flex justify-center">
         <motion.div 
           initial={{ y: -20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-white px-5 py-2.5 rounded-full pointer-events-auto border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-3 backdrop-blur-3xl"
         >
            <div className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green/70"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green shadow-sm"></span>
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-wide">Live Routes Active</span>
         </motion.div>
      </div>

      {/* Search Bar - Top Floating */}
      <div className="absolute top-28 left-4 right-4 z-[400] flex justify-center pointer-events-none">
        <div className="bg-white w-full max-w-sm rounded-[20px] pointer-events-auto flex items-center px-4 py-3 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
           <Search className="w-5 h-5 text-brand-blue mr-3" />
           <input type="text" placeholder="Search places..." className="w-full outline-none text-slate-900 font-medium placeholder-slate-400 bg-transparent" />
        </div>
      </div>

      {/* Map Mode Switches - Bottom Floating */}
      <div className="absolute bottom-28 left-4 right-4 z-[400] pointer-events-none flex justify-center">
        <div className="bg-white p-1.5 rounded-full pointer-events-auto border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-1">
          <button className="px-4 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm">Fast</button>
          <button className="px-4 py-1.5 rounded-full text-slate-500 hover:text-slate-900 font-bold text-sm">Scenic</button>
          <button className="px-4 py-1.5 rounded-full text-slate-500 hover:text-slate-900 font-bold text-sm">Safe</button>
        </div>
      </div>

      {/* Cinematic Bottom Sheet for Selected Vehicle */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute bottom-20 left-4 right-4 z-[1000]"
          >
            <div className="bg-white rounded-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border border-slate-200">
               {/* Drag Handle */}
               <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
               
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className={cn(
                       "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 border border-slate-200",
                       selectedVehicle.type === 'bus' ? "text-brand-blue" : "text-brand-green"
                     )}>
                       {selectedVehicle.routeNumber}
                     </span>
                     {selectedVehicle.status === 'delayed' && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Delayed
                        </span>
                     )}
                   </div>
                   <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display">{selectedVehicle.routeName}</h2>
                 </div>
                 
                 <div className="text-right">
                   <div className="text-3xl font-black text-slate-900 tracking-tighter">
                     {selectedVehicle.speed}<span className="text-sm text-slate-500 ml-1 font-sans font-medium tracking-normal">km/h</span>
                   </div>
                 </div>
               </div>

               {/* Metrics Grid */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1 font-bold">
                       <Users className="w-4 h-4 text-brand-blue" /> Crowd
                    </div>
                    <div className="font-bold capitalize text-lg flex items-center gap-2 text-slate-900">
                       {selectedVehicle.crowdLevel === 'empty' && <span className="w-3 h-3 rounded-full bg-brand-green shadow-sm" />}
                       {selectedVehicle.crowdLevel === 'moderate' && <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />}
                       {(selectedVehicle.crowdLevel === 'crowded' || selectedVehicle.crowdLevel === 'full') && <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />}
                       {selectedVehicle.crowdLevel}
                    </div>
                 </div>
                 <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1 font-bold">
                       <Navigation2 className="w-4 h-4 text-brand-orange" /> ETA to You
                    </div>
                    <div className="font-bold text-lg text-brand-green">
                       {userPos ? (
                         (() => {
                           const R = 6371e3; // meters
                           const dLat = (userPos.lat - selectedVehicle.lat) * Math.PI / 180;
                           const dLon = (userPos.lng - selectedVehicle.lng) * Math.PI / 180;
                           const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(selectedVehicle.lat * Math.PI / 180) * Math.cos(userPos.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                           const distanceMeters = R * c;
                           const speedKmh = selectedVehicle.speed || 20; // fallback avg 20 kmh
                           const speedMs = speedKmh * (1000 / 3600);
                           const etaMins = Math.max(1, Math.round((distanceMeters / speedMs) / 60));
                           return etaMins > 60 ? '>1 hr' : `${etaMins} Min`;
                         })()
                       ) : (
                         `${Math.max(1, Math.floor(60 / (selectedVehicle.speed || 30)))} Min`
                       )}
                    </div>
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     if (mapRef && selectedVehicle) {
                       mapRef.flyTo([selectedVehicle.lat, selectedVehicle.lng], 16, { animate: true, duration: 1 });
                     }
                   }}
                   className="flex-1 bg-brand-blue hover:bg-sky-600 text-white py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-sm"
                 >
                    Locate Vehicle
                 </button>
                 <button 
                   onClick={() => handleSetSelectedVehicleId(null)}
                   className="w-16 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors active:scale-[0.98]"
                 >
                    <X className="w-6 h-6 text-slate-600 hover:text-slate-900" />
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
