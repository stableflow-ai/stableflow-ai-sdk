import { useCallback, useEffect, useRef } from "react";

export function useDebounceFn(fn: any, options: { wait: number; }) {
  const { wait } = options;

  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const run = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fn();
    }, wait);
  }, [fn, wait]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  return {
    run,
    cancel,
  };
}
