import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const HydrateGate = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rehydrate = useAuthStore.persist?.rehydrate;
    const run = rehydrate ? rehydrate() : Promise.resolve();
    Promise.resolve(run).finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="card">Đang khôi phục phiên...</div>;
  }

  return children;
};

export default HydrateGate;
