import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Stats } from "../types";

interface StatsState {
  stats: Stats | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: StatsState = {
  stats: null,
  loading: true,
  error: null,
};

export function useStats() {
  const [state, setState] = useState<StatsState>(INITIAL_STATE);

  const loadStats = useCallback(async () => {
    setState((current) => ({
      stats: current.stats,
      loading: true,
      error: null,
    }));

    try {
      const { ok, data } = await api.stats();
      if (!ok) {
        const message = (data as { error?: string }).error;
        throw new Error(message ?? "stats are unavailable");
      }

      setState({ stats: data, loading: false, error: null });
    } catch (error) {
      setState((current) => ({
        stats: current.stats,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "failed to connect to the stats service",
      }));
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return { ...state, retry: loadStats };
}
