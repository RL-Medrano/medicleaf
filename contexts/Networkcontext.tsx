/**
 * contexts/NetworkContext.tsx
 *
 * App-wide, live-updating connectivity state. Wrap the root layout with
 * <NetworkProvider> once, then any screen can call useNetwork() to read
 * the current connection status reactively — no per-screen checks needed.
 *
 * This complements (doesn't replace) utils/network.ts's checkIsOnline():
 *   - useNetwork()     -> continuous, app-wide, good for banners/UI state
 *   - checkIsOnline()  -> one-off, precise, good for gating an action
 *     right at the moment it happens (e.g. right before a Save/Post call)
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

type NetworkContextValue = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isInternetReachable: true,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkContextValue>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((info: NetInfoState) => {
      setState({
        isConnected: info.isConnected ?? false,
        isInternetReachable: info.isInternetReachable,
      });
    });
    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={state}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  return useContext(NetworkContext);
}