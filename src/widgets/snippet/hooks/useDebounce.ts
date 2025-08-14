import { useState, useEffect, useRef } from "react";

/**
 * Debounce an async function call and automatically store the returned result.
 * @param callback - Async function that returns the result.
 * @param delay - Delay in milliseconds before executing.
 * @param deps - Dependencies to trigger debounce.
 */
export function useDebounce<T>(
  delay: number,
  callback: () => Promise<T>,
  deps: any[] = []
) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const handlerRef = useRef<number>();

  useEffect(() => {
    if (handlerRef.current) {
      clearTimeout(handlerRef.current);
    }

    handlerRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        setResult(await callback());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      if (handlerRef.current) {
        clearTimeout(handlerRef.current);
      }
    };
  }, deps);

  return [result, error, loading] as const;
}