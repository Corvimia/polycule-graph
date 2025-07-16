import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const getSystemPref = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const getStoredPref = () => {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return null;
    };
    const [dark, setDark] = useState(() => {
      const stored = getStoredPref();
      return stored !== null ? stored : getSystemPref();
    });
  
    useEffect(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        const stored = getStoredPref();
        if (stored === null) setDark(e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);
  
    useEffect(() => {
      document.documentElement.classList.toggle('dark', dark);
      document.body.classList.toggle('dark', dark);
    }, [dark]);
  
    const toggle = () => {
      setDark(d => {
        localStorage.setItem('theme', !d ? 'dark' : 'light');
        return !d;
      });
    };
  
    const setTheme = (theme: 'light' | 'dark' | null) => {
      if (theme === 'dark') {
        localStorage.setItem('theme', 'dark');
        setDark(true);
      } else if (theme === 'light') {
        localStorage.setItem('theme', 'light');
        setDark(false);
      } else {
        localStorage.removeItem('theme');
        setDark(getSystemPref());
      }
    };
  
    return (
      <ThemeContext.Provider value={{ dark, toggle, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }
  