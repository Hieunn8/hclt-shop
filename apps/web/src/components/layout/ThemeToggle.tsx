"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && theme === "light";
  return (
    <button
      aria-label="Đổi giao diện sáng tối"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      style={{
        minWidth: 44,
        minHeight: 44,
        borderRadius: 999,
        border: "1px solid var(--outline-variant)",
        background: "var(--surface-container)",
        color: "var(--on-surface)"
      }}
    >
      {isLight ? <Moon size={18} style={{ margin: "auto" }} /> : <Sun size={18} style={{ margin: "auto" }} />}
    </button>
  );
}
