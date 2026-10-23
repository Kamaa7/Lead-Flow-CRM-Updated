import { useCallback, useEffect, useState } from 'react';
import { getStoreProfile } from '../services/storeApi';

export const useStoreProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setProfile(await getStoreProfile());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, currency: profile?.currency || 'INR', loading, error, reload, setProfile };
};
