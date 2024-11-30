"use client";

import { useThemeMode } from "flowbite-react";
import { useEffect } from "react";

export default function ThemeToggleWatcher() {
  const { mode } = useThemeMode();
  useEffect(() => {
    const themeElement = document.querySelector('meta[name="theme-color"]');
    if (mode === "dark") {
      themeElement?.setAttribute("content", "#212836");
    } else {
      themeElement?.setAttribute("content", "#ffffff");
    }
  }, [mode]);

  return null;
}
