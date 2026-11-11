import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/", "Train"],
  ["/library", "Library"],
  ["/history", "History"],
  ["/progress", "Progress"],
];

export function Shell() {
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" end>
          <strong>TATESPEECH</strong>
          <span>Command speech</span>
        </NavLink>
        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : undefined)}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
