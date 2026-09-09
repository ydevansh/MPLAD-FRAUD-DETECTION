import { useState, useCallback } from 'react';
import type { UserLocation } from '../types';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; location: UserLocation }
  | { status: 'error'; message: string };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', message: 'Your browser does not support location services.' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      pos => setState({
        status: 'success',
        location: {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
        },
      }),
      err => {
        const messages: Record<number, string> = {
          1: 'Location permission was denied. You can still browse projects without nearby sorting.',
          2: 'Unable to determine your location. Please try again.',
          3: 'Unable to determine your location. Please try again.',
        };
        setState({ status: 'error', message: messages[err.code] || 'Unable to determine your location. Please try again.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { state, requestLocation };
}

/** Haversine distance between two coordinates — returns km */
export function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
