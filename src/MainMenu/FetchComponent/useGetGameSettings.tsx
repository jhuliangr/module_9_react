import { useSettingsStore } from '#shared/stores';
import { apiClient } from '#shared/utils/api-client';
import { useEffect, useState } from 'react';

export function useGetGameSettings() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const settings = useSettingsStore();
  useEffect(() => {
    async function getGameSettings() {
      setLoading(true);
      try {
        const response = await apiClient.gameService.getGameServerInfo();
        // TODO: send version from server to update settings if necessary
        settings.setSettingsFromServer(response);
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    getGameSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { loading, error };
}
