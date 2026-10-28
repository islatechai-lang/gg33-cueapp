import React, { createContext, useContext, useEffect, useState } from "react";
import { iframeSdk, registerWhopThemeListener } from "@/lib/whop-iframe";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  // 1. Check URL parameters (standard Whop embed param)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get("theme") || params.get("appearance");
    if (urlTheme === "light" || urlTheme === "dark") {
      return urlTheme;
    }
  } catch {}

  // 2. Check localStorage if user manually set it
  try {
    const saved = localStorage.getItem("numastro_theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {}

  // 3. System preference fallback
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch {}

  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply theme class to <html> and <body>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    }

    try {
      localStorage.setItem("numastro_theme", theme);
    } catch {}
  }, [theme]);

  // Synchronize with Whop theme events and environment
  useEffect(() => {
    // A. Listen via @whop/iframe createSdk callback
    const unsubscribeSdk = registerWhopThemeListener((appearance) => {
      if (appearance === "light" || appearance === "dark") {
        setThemeState(appearance);
      }
    });

    // B. Listen for frosted-ui:set-theme dispatched by @whop/iframe internally
    const handleFrostedTheme = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const appearance = detail?.appearance;
      if (appearance === "light" || appearance === "dark") {
        setThemeState(appearance);
      }
    };
    document.documentElement.addEventListener("frosted-ui:set-theme", handleFrostedTheme);

    // C. Query iframeSdk.getColorTheme if already available
    if (iframeSdk && typeof (iframeSdk as any).getColorTheme === "function") {
      (iframeSdk as any)
        .getColorTheme()
        .then((themeInfo: any) => {
          if (themeInfo?.appearance === "light" || themeInfo?.appearance === "dark") {
            setThemeState(themeInfo.appearance);
          }
        })
        .catch(() => {});
    }

    // D. Listen to postMessage from Whop parent
    const handlePostMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onColorThemeChange" && data?.request?.appearance) {
          const app = data.request.appearance;
          if (app === "light" || app === "dark") setThemeState(app);
        } else if (data?.type === "whop:theme-change" && data?.appearance) {
          const app = data.appearance;
          if (app === "light" || app === "dark") setThemeState(app);
        }
      } catch {}
    };
    window.addEventListener("message", handlePostMessage);

    // E. Listen to OS / browser preference changes if outside Whop
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      // Only apply if user hasn't stored a manual preference or inside iframe
      const isIframe = window.self !== window.top;
      if (!isIframe && !localStorage.getItem("numastro_theme")) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      unsubscribeSdk();
      document.documentElement.removeEventListener("frosted-ui:set-theme", handleFrostedTheme);
      window.removeEventListener("message", handlePostMessage);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
