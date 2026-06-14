import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Generic hook for fetching async data from an API call.
 *
 * @param {Function} fetcher - async function that returns the data
 * @param {Array}    deps    - dependency array that triggers a re-fetch when changed
 *
 * Usage:
 *   const { data, loading, error, reload } = useApiData(() => api.getTodos(), []);
 */
export function useApiData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep a stable reference to the fetcher to avoid spurious re-runs
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  return { data, loading, error, reload: load };
}
