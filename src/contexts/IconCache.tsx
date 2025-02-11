import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

const ICON_CACHE_KEY = "icon-cache-v1";

interface IconCacheContextType {
  getIconPath: (domain: string) => string | undefined;
  setIconPath: (domain: string, path: string) => void;
}

const IconCacheContext = createContext<IconCacheContextType | undefined>(
  undefined
);

export function IconCacheProvider({ children }: { children: ReactNode }) {
  const [iconCache, setIconCache] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem(ICON_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error("Failed to load icon cache from localStorage:", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(iconCache));
    } catch (error) {
      console.error("Failed to save icon cache to localStorage:", error);
    }
  }, [iconCache]);

  const getIconPath = (domain: string) => iconCache[domain];

  const setIconPath = (domain: string, path: string) => {
    setIconCache((prev) => ({ ...prev, [domain]: path }));
  };

  return (
    <IconCacheContext.Provider value={{ getIconPath, setIconPath }}>
      {children}
    </IconCacheContext.Provider>
  );
}

export function useIconCache(): IconCacheContextType {
  const context = useContext(IconCacheContext);
  if (context === undefined) {
    throw new Error("useIconCache must be used within an IconCacheProvider");
  }
  return context;
}
