import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const THEME_KEY = "ink-vellum-theme";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("light-theme", theme === "light");
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <nav className="flex flex-col w-52 bg-ink-surface border-r border-ink-border shrink-0">
        <div className="px-5 pt-5 pb-4">
          <h1 className="font-(family-name:--font-display) text-xl text-amber tracking-wide">
            Ink &amp; Vellum
          </h1>
          <p className="font-(family-name:--font-ui) text-xs text-ink-text-subtle mt-1">
            小说创作工作室
          </p>
        </div>
        <div className="flex flex-col flex-1 gap-0.5 px-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-(family-name:--font-ui) transition-ink ${
                isActive
                  ? "bg-amber-subtle text-amber border-l-2 border-amber"
                  : "text-ink-text-dim hover:text-ink-text hover:bg-ink-surface-hover"
              }`
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
            <span>项目</span>
          </NavLink>
          <NavLink
            to="/skills"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-(family-name:--font-ui) transition-ink ${
                isActive
                  ? "bg-amber-subtle text-amber border-l-2 border-amber"
                  : "text-ink-text-dim hover:text-ink-text hover:bg-ink-surface-hover"
              }`
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>灵魂写手</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-(family-name:--font-ui) transition-ink ${
                isActive
                  ? "bg-amber-subtle text-amber border-l-2 border-amber"
                  : "text-ink-text-dim hover:text-ink-text hover:bg-ink-surface-hover"
              }`
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>设置</span>
          </NavLink>
        </div>
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-ink-border pt-3">
            <p className="px-3 text-[10px] text-ink-text-subtle font-(family-name:--font-ui) uppercase tracking-widest">
              AI Writing Studio
            </p>
            <button
              type="button"
              onClick={toggleTheme}
              className="mt-2 flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink-text-dim hover:text-ink-text hover:bg-ink-surface-hover rounded-lg transition-ink"
              title={theme === "dark" ? "切换亮色主题" : "切换暗色主题"}
            >
              {theme === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="亮色模式">
                  <title>亮色模式</title>
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="暗色模式">
                  <title>暗色模式</title>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              <span>{theme === "dark" ? "亮色模式" : "暗色模式"}</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto bg-ink-bg">{children}</main>
    </div>
  );
}
