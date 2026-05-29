import { NavLink } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
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
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto bg-ink-bg">{children}</main>
    </div>
  );
}
