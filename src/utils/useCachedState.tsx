import { useEffect, useState } from "react";

export function useCachedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    if (!storedValue || storedValue === "undefined") {
      return initialValue;
    }
    try {
      const parsedValue = JSON.parse(storedValue);
      return parsedValue;
    } catch (error) {
      console.error(
        `Failed to parse cached state: ${key}-${storedValue}`,
        error
      );
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}
