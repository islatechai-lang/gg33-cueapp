import { createSdk } from "@whop/iframe";

const appId = import.meta.env.VITE_WHOP_APP_ID;

if (!appId) {
  console.warn("VITE_WHOP_APP_ID is missing. Whop features will be disabled.");
}

type ThemeListener = (appearance: 'light' | 'dark') => void;
const themeListeners = new Set<ThemeListener>();

export function registerWhopThemeListener(cb: ThemeListener) {
  themeListeners.add(cb);
  return () => {
    themeListeners.delete(cb);
  };
}

export function notifyWhopTheme(appearance: 'light' | 'dark') {
  themeListeners.forEach((fn) => {
    try {
      fn(appearance);
    } catch (err) {
      console.error("Error in theme listener:", err);
    }
  });
}

export const iframeSdk = appId
  ? createSdk({
      appId,
      onMessage: {
        onColorThemeChange: async (theme) => {
          if (theme?.appearance === 'light' || theme?.appearance === 'dark') {
            notifyWhopTheme(theme.appearance);
          }
        },
      },
    })
  : null;
