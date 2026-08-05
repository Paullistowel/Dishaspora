import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface NetworkState {
  /** Device has a network interface up (wifi/cellular). */
  isConnected: boolean;
  /** The internet is actually reachable (captive-portal aware). Null = unknown. */
  isInternetReachable: boolean | null;
  /** Convenience: definitively offline (connected === false OR unreachable). */
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkState>({
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
});

// Bridge NetInfo → React Query so queries/mutations pause only when there's NO
// network interface at all. We deliberately do NOT gate on isInternetReachable:
// on LAN/hotspot/captive-portal setups it's often false even though the backend
// is perfectly reachable — gating on it made the app "buffer forever" offline.
// Let the actual request succeed/fail drive the UI instead.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  });
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
  });

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      const isConnected = !!s.isConnected;
      const isInternetReachable = s.isInternetReachable;
      setState({
        isConnected,
        isInternetReachable,
        isOffline: !isConnected,
      });
    });
    // Prime with the current value on mount.
    NetInfo.fetch().then((s) => {
      const isConnected = !!s.isConnected;
      const isInternetReachable = s.isInternetReachable;
      setState({
        isConnected,
        isInternetReachable,
        isOffline: !isConnected,
      });
    });
    return unsub;
  }, []);

  const value = useMemo(() => state, [state]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

/** Subscribe to connectivity. Re-renders only when the network state changes. */
export function useNetwork(): NetworkState {
  return useContext(NetworkContext);
}
