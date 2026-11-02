export type LiveCoordinates = {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: number;
};

// The browser reports this radius from GPS/Wi-Fi positioning in metres.
// Registration and the directory can still work with an approximate position;
// only the server decides whether a position is precise enough to save.
export const MAX_LOCATION_ACCURACY_METERS = 100;
const IDEAL_LOCATION_ACCURACY_METERS = 25;

const highAccuracyOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 60_000,
  // A server restart commonly causes the first GPS request to be a cold
  // request.  A position captured in the last 30 seconds is still verified
  // as fresh below, and lets the browser return promptly while GPS refines.
  maximumAge: 30_000,
};

const fallbackOptions: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 45_000,
  maximumAge: 30_000,
};

const toCoordinates = (position: GeolocationPosition): LiveCoordinates => {
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Your device returned an invalid location. Please try again.');
  }
  if (!Number.isFinite(accuracy) || accuracy <= 0) {
    throw new Error('Your device did not provide a reliable location accuracy. Enable GPS and try again.');
  }
  const capturedAt = Number(position.timestamp);
  if (!Number.isFinite(capturedAt) || Math.abs(Date.now() - capturedAt) > 2 * 60_000) {
    throw new Error('Your location fix is stale. Please capture a fresh GPS location.');
  }
  return { lat: latitude, lng: longitude, accuracy, capturedAt };
};

const readBestFreshPosition = (options: PositionOptions, collectionWindowMs: number) =>
  new Promise<LiveCoordinates>((resolve, reject) => {
    let settled = false;
    let bestPosition: LiveCoordinates | null = null;
    let watchId: number | null = null;
    let timeoutId: number | undefined;
    let validFixTimeoutId: number | undefined;
    const stopWatching = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };
    const clearTimers = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (validFixTimeoutId !== undefined) window.clearTimeout(validFixTimeoutId);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      stopWatching();
      clearTimers();
      if (!bestPosition) reject(new Error('Your device could not determine a location.'));
      else resolve(bestPosition);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      // Some browsers emit a temporary provider error after returning a
      // usable position. Keep that valid fresh position instead of failing.
      if (bestPosition) {
        finish();
        return;
      }
      settled = true;
      stopWatching();
      clearTimers();
      reject(error);
    };
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (settled) return;
        try {
          const nextPosition = toCoordinates(position);
          if (!bestPosition || nextPosition.accuracy < bestPosition.accuracy) bestPosition = nextPosition;
          // Use an ideal GPS fix immediately. A valid but less precise fix is
          // held briefly so a better GPS update can arrive, rather than making
          // the registration screen wait for the entire collection window.
          if (nextPosition.accuracy <= IDEAL_LOCATION_ACCURACY_METERS) finish();
          else if (validFixTimeoutId === undefined) {
            validFixTimeoutId = window.setTimeout(finish, 4_000);
          }
        } catch (error) {
          fail(error);
        }
      },
      fail,
      options
    );
    // Geolocation callbacks are normally asynchronous, but a few embedded
    // browsers can deliver a cached result while watchPosition is starting.
    // Clean up that watcher too instead of leaking it after the request ends.
    if (settled) stopWatching();
    // Continue collecting when the first reading is outside the accepted
    // accuracy radius, allowing a phone time to lock onto GPS.
    if (!settled) timeoutId = window.setTimeout(finish, collectionWindowMs);
  });

export const getLocationErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = Number((error as GeolocationPositionError).code);
    if (code === 1) return 'Location permission was denied. Enable it in your browser settings and try again.';
    if (code === 2) return 'Your device could not determine a location. Turn on GPS, Wi-Fi, or mobile data and try again.';
    if (code === 3) return 'Getting your location timed out. Please try again.';
  }
  return error instanceof Error && error.message ? error.message : 'Unable to fetch your current location.';
};

export const getLiveLocation = async (): Promise<LiveCoordinates> => {
  const isLocalDevelopment = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname);
  if (!window.isSecureContext && !isLocalDevelopment) {
    throw new Error('Live location requires HTTPS (or localhost). Open the secure version of KARMYOGI and try again.');
  }
  if (!('geolocation' in navigator)) {
    throw new Error('This browser does not support live location sharing.');
  }

  try {
    return await readBestFreshPosition(highAccuracyOptions, 20_000);
  } catch (error) {
    // GPS can be slow indoors. Retry with the network location provider except
    // when the user has explicitly denied access.
    if (Number((error as GeolocationPositionError).code) === 1) throw error;
    return readBestFreshPosition(fallbackOptions, 12_000);
  }
};
