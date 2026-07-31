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

// Bridge NetInfo → React Query so queries/mutations pause while offline and
// auto-resume (and retry) when connectivity returns. Registered once at module
// load, before any provider mounts.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
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
        isOffline: !isConnected || isInternetReachable === false,
      });
    });
    // Prime with the current value on mount.
    NetInfo.fetch().then((s) => {
      const isConnected = !!s.isConnected;
      const isInternetReachable = s.isInternetReachable;
      setState({
        isConnected,
        isInternetReachable,
        isOffline: !isConnected || isInternetReachable === false,
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
