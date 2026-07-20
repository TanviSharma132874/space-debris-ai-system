import { createContext, useContext, useState } from 'react';

const SpaceEngineContext = createContext(null);

export function SpaceEngineProvider({ children }) {
  const [selectedId, setSelectedId] = useState(null);
  const [cameraState, setCameraState] = useState({ zoom: 1, rotation: 0 });
  const [epoch, setEpoch] = useState(() => Date.now());

  const value = { selectedId, setSelectedId, cameraState, setCameraState, epoch, setEpoch };
  return <SpaceEngineContext.Provider value={value}>{children}</SpaceEngineContext.Provider>;
}

export const useSpaceEngine = () => useContext(SpaceEngineContext);
