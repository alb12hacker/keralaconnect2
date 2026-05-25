import { setDoc, doc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { type Vehicle } from '../types';

const getEffectiveUser = () => {
  if (auth.currentUser) return auth.currentUser;
  const savedGuest = localStorage.getItem('keralaconnect_guest_user');
  if (savedGuest) {
    try {
      return JSON.parse(savedGuest);
    } catch {
      return null;
    }
  }
  return null;
};

class DriverTrackingEngine {
  private static instance: DriverTrackingEngine;
  private watchId: number | null = null;
  private wakeLock: any = null;
  private bgAudio: HTMLAudioElement | null = null;
  private heartbeatInterval: any = null;
  private lastUpdate = 0;
  private lastLat = 0;
  private lastLng = 0;
  private lastSpeed = 0;
  private lastHeading = 0;
  private offlineQueue: Vehicle[] = [];
  public isTracking = false;
  
  private constructor() {
    window.addEventListener('online', () => {
      this.log('Network connected. Syncing offline updates...');
      this.syncOfflineQueue();
      if (this.isTracking) this.restartWatch(); // Force refresh on reconnect
    });

    document.addEventListener('visibilitychange', async () => {
      if (this.isTracking && document.visibilityState === 'visible') {
        this.log('Page visible, re-acquiring wake lock...');
        await this.requestWakeLock();
      }
    });
  }

  public static getInstance(): DriverTrackingEngine {
    if (!DriverTrackingEngine.instance) {
      DriverTrackingEngine.instance = new DriverTrackingEngine();
    }
    return DriverTrackingEngine.instance;
  }

  // Exposing actively tracked info to restore UI state
  public activeBusId = '';
  public activeRouteName = '';
  public activeRouteNumber = '';

  private listeners: (() => void)[] = [];
  
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Configuration
  private readonly MIN_UPDATE_INTERVAL_MS = 5000; // 5 seconds min delay to avoid spamming
  private readonly MIN_DISTANCE_METERS = 30; // 30 meters
  private readonly MIN_SPEED_CHANGE_KMH = 15; // 15 km/h change
  private readonly MIN_HEADING_CHANGE_DEG = 45; // 45 degree turn
  private readonly STATIONARY_UPDATE_INTERVAL_MS = 60000; // 1 minute if not moving

  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[DriverTracking ${timestamp}] ${message}`, data ? data : '');
  }

  private errorLog(message: string, error: any) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.error(`[DriverTracking ERR ${timestamp}] ${message}`, error);
  }

  private getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.log('Screen Wake Lock engaged. Screen will not sleep.');
        
        this.wakeLock.addEventListener('release', () => {
          this.log('Screen Wake Lock was released.');
        });
      } else {
        this.log('Wake Lock API not supported by this browser.');
      }
    } catch (err: any) {
      // Mute NotAllowedError in iframes where permissions policy blocks wake lock
      if (err.name !== 'NotAllowedError') {
        this.errorLog(`Wake Lock error`, err);
      } else {
        this.log('Wake Lock request denied by permissions policy (expected in iframe without screen-wake-lock allowed).');
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release().then(() => {
        this.wakeLock = null;
      });
    }
  }

  // --- Background Persistence Hooks ---

  private setupBackgroundAudio() {
    if (!this.bgAudio) {
      // 1-second silent audio element to prevent Safari/Chrome from freezing the background JS context
      this.bgAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      this.bgAudio.loop = true;
    }
  }

  private startBackgroundAudio() {
    this.setupBackgroundAudio();
    if (this.bgAudio) {
      this.bgAudio.play().catch(e => this.errorLog("Background audio play blocked", e));
    }
  }

  private stopBackgroundAudio() {
    if (this.bgAudio) {
      this.bgAudio.pause();
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.isTracking) return;
      const now = Date.now();
      // If we haven't seen a GPS event in 45s, restart the watcher
      if (now - this.lastUpdate > 45000) {
        this.log("WatchPosition stalled (no data for > 45s). Restarting...");
        this.restartWatch();
      }
    }, 15000); // Check every 15s
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private restartWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.log("Restarting watchPosition listener...");
    this.attachWatchPosition();
  }

  // Process and sync offline updates
  private async syncOfflineQueue() {
    if (this.offlineQueue.length === 0 || !navigator.onLine) return;
    
    this.log(`Syncing ${this.offlineQueue.length} offline updates...`);
    // Keep only the latest update per vehicle ID to avoid spamming the DB with stale offline points
    const uniqueUpdates = new Map<string, Vehicle>();
    this.offlineQueue.forEach(update => uniqueUpdates.set(update.id, update));
    
    const queueToProcess = Array.from(uniqueUpdates.values());
    this.offlineQueue = [];

    let successCount = 0;
    for (const update of queueToProcess) {
      if (!navigator.onLine) {
        this.log('Connection lost while syncing. Re-queueing remaining items.');
        this.offlineQueue.push(update);
        continue;
      }
      try {
         await setDoc(doc(db, 'vehicles', update.id), update, { merge: true });
         successCount++;
      } catch (e) {
         this.errorLog('Failed to sync offline record', e);
         // Put back on queue if failed
         this.offlineQueue.push(update);
      }
    }
    
    if (successCount > 0) {
      this.log(`Successfully synced ${successCount} offline updates.`);
    }
    
    if (this.offlineQueue.length > 0 && navigator.onLine) {
      // Retry in 5 seconds if there are still items in the queue and we think we are online
      setTimeout(() => this.syncOfflineQueue(), 5000);
    }
  }

  public async start(busId: string, routeName: string, routeNumber: string) {
    if (this.isTracking) {
      this.log("Tracking already active. Ignoring start request.");
      return;
    }
    const effectiveUser = getEffectiveUser();
    if (!effectiveUser) {
      this.errorLog("No authenticated user found", null);
      return;
    }

    this.isTracking = true;
    this.activeBusId = busId;
    this.activeRouteName = routeName;
    this.activeRouteNumber = routeNumber;
    this.notify();
    const driverId = effectiveUser.uid;
    this.log(`Starting tracking for Driver: ${driverId}, Bus: ${busId}`);

    await this.requestWakeLock();

    if (!('geolocation' in navigator)) {
      this.errorLog("Geolocation is not supported by this browser.", null);
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude, speed, heading } = pos.coords;
      const baseVehicle: Vehicle = {
        id: busId,
        driverId,
        type: 'bus',
        routeNumber,
        routeName,
        lat: latitude,
        lng: longitude,
        heading: heading || 0,
        speed: speed ? speed * 3.6 : 0,
        crowdLevel: 'moderate',
        status: 'active',
        lastUpdated: new Date().toISOString()
      };
      
      this.lastLat = latitude;
      this.lastLng = longitude;
      this.lastUpdate = Date.now();

      // Instantly publish the active trip to make it visible publicly
      if (navigator.onLine) {
        setDoc(doc(db, 'vehicles', busId), baseVehicle, { merge: true })
          .catch(e => this.errorLog("Initial Firebase Write Error", e));
      } else {
        this.offlineQueue.push(baseVehicle);
      }
    }, (err) => {
      this.errorLog("Could not get initial location", err);
      // Fallback to 0,0
      const baseVehicle: Vehicle = {
        id: busId,
        driverId,
        type: 'bus',
        routeNumber,
        routeName,
        lat: 0,
        lng: 0,
        heading: 0,
        speed: 0,
        crowdLevel: 'moderate',
        status: 'active',
        lastUpdated: new Date().toISOString()
      };
      if (navigator.onLine) {
        setDoc(doc(db, 'vehicles', busId), baseVehicle, { merge: true })
          .catch(e => this.errorLog("Initial Firebase Write Error", e));
      } else {
        this.offlineQueue.push(baseVehicle);
      }
    });

    this.log("Listening for GPS updates...");
    
    this.startBackgroundAudio();
    this.startHeartbeat();
    this.attachWatchPosition();
  }

  private attachWatchPosition() {
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        const now = Date.now();

        // 1. Accuracy Filter
        if (accuracy > 100) {
          this.log(`Ignoring inaccurate GPS point (${Math.round(accuracy)}m)`);
          return; // Ignore wildly inaccurate points
        }

        const distanceMoved = this.getDistanceInMeters(this.lastLat, this.lastLng, latitude, longitude);
        const timeElapsed = now - this.lastUpdate;

        // 2. Logic Filter: updates based on distance, speed change, heading change, or stationary heartbeat
        const currentSpeed = speed !== null ? speed * 3.6 : (distanceMoved / (timeElapsed / 1000)) * 3.6; // km/h
        const currentHeading = heading !== null ? heading : 0;

        const isSignificantMove = distanceMoved >= this.MIN_DISTANCE_METERS;
        const isSignificantSpeedChange = Math.abs(currentSpeed - this.lastSpeed) >= this.MIN_SPEED_CHANGE_KMH;
        // Handle heading wrap around
        let headingDiff = Math.abs(currentHeading - this.lastHeading);
        if (headingDiff > 180) headingDiff = 360 - headingDiff;
        const isSignificantHeadingChange = headingDiff >= this.MIN_HEADING_CHANGE_DEG;
        
        const isTimeAllowed = timeElapsed >= this.MIN_UPDATE_INTERVAL_MS;
        const isStationaryHeartbeat = timeElapsed >= this.STATIONARY_UPDATE_INTERVAL_MS;

        const needsUpdate = (isTimeAllowed && (isSignificantMove || isSignificantSpeedChange || isSignificantHeadingChange)) || isStationaryHeartbeat;

        if (needsUpdate) {
          
          this.log(`GPS Update -> Dist: ${Math.round(distanceMoved)}m, SpeedDiff: ${Math.round(Math.abs(currentSpeed - this.lastSpeed))}km/h, HeadDiff: ${Math.round(headingDiff)}°`);
          
          this.lastUpdate = now;
          this.lastLat = latitude;
          this.lastLng = longitude;
          this.lastSpeed = currentSpeed;
          this.lastHeading = currentHeading;
          
          // Determine status based on speed/movement
          let status: 'active' | 'delayed' | 'inactive' = 'active';
          if (currentSpeed < 5 && isStationaryHeartbeat) status = 'delayed'; // likely stopped in traffic for a while

          const effectiveUser = getEffectiveUser();
          const updateData: Vehicle = {
            id: this.activeBusId,
            driverId: effectiveUser ? effectiveUser.uid : 'guest-driver',
            type: 'bus',
            routeNumber: this.activeRouteNumber,
            routeName: this.activeRouteName,
            lat: latitude,
            lng: longitude,
            speed: currentSpeed || 0,
            heading: currentHeading || 0,
            crowdLevel: 'moderate',
            status,
            lastUpdated: new Date().toISOString()
          };

          if (navigator.onLine) {
            try {
              await setDoc(doc(db, 'vehicles', this.activeBusId), updateData, { merge: true });
              this.log(`Synced to DB: Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}, Speed ${Math.round(currentSpeed)} km/h`);
              this.syncOfflineQueue();
            } catch (error) {
              this.errorLog("Firebase Write Error, queueing offline", error);
              this.offlineQueue.push(updateData);
              handleFirestoreError(error, OperationType.WRITE, `vehicles/${this.activeBusId}`);
            }
          } else {
            this.log("Offline mode, queueing update.");
            this.offlineQueue.push(updateData);
          }
        }
      },
      (error) => {
        this.errorLog("GPS Watch Error", error.message);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 5000, 
        timeout: 10000 
      }
    );
  }

  public stop(busId: string) {
    if (!this.isTracking) return;
    this.log("Stopping trip and tracker.");

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.stopHeartbeat();
    this.stopBackgroundAudio();
    this.releaseWakeLock();
    this.isTracking = false;
    this.activeBusId = '';
    this.activeRouteName = '';
    this.activeRouteNumber = '';
    this.notify();

    // Send terminal inactive state
    if (navigator.onLine) {
      setDoc(doc(db, 'vehicles', busId), { status: 'inactive' }, { merge: true })
        .catch(error => handleFirestoreError(error, OperationType.WRITE, `vehicles/${busId}`));
    }
  }
}

export const trackingEngine = DriverTrackingEngine.getInstance();

// Compatibility exports to avoid breaking changes in ProfileScreen
export const startDriverTracking = (busId: string, routeName: string, routeNumber: string) => trackingEngine.start(busId, routeName, routeNumber);
export const stopDriverTracking = (busId: string) => trackingEngine.stop(busId);
