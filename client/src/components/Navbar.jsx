import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navClass = ({ isActive }) =>
    [
      'text-sm font-medium transition-colors',
      isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2',
    ].join(' ');

  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!menuOpen) return;
      const el = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    function onDocKeyDown(e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-sm">
            Sb
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            Sellb
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              [
                navClass({ isActive }),
                'rounded-lg px-2.5 py-2',
                isActive ? 'bg-slate-100/70' : 'hover:bg-slate-100/60',
              ].join(' ')
            }
          >
            Books
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  [
                    navClass({ isActive }),
                    'hidden rounded-lg px-2.5 py-2 sm:inline-flex',
                    isActive ? 'bg-slate-100/70' : 'hover:bg-slate-100/60',
                  ].join(' ')
                }
              >
                Dashboard
              </NavLink>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen ? 'true' : 'false'}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-2 py-1.5 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white">
                    {userInitials}
                  </span>
                  <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 sm:block">
                    {user?.name || user?.email}
                  </span>
                  <span className="hidden text-slate-400 sm:inline">▾</span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-lg"
                  >
                    <div className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {user?.name || 'Account'}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 line-clamp-1">{user?.email}</div>
                    </div>
                    <div className="h-px bg-slate-200/70" />

                    <div className="p-2">
                      <NavLink
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          [
                            'flex w-full items-center rounded-xl px-3 py-2 text-sm transition',
                            isActive
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                          ].join(' ')
                        }
                        role="menuitem"
                      >
                        Dashboard
                      </NavLink>

                      {user.role === 'admin' && (
                        <NavLink
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className={({ isActive }) =>
                            [
                              'mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm transition',
                              isActive
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                            ].join(' ')
                          }
                          role="menuitem"
                        >
                          Admin
                        </NavLink>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  [
                    'rounded-xl px-3 py-2 text-sm font-semibold transition',
                    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm',
                    'hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2',
                    isActive ? 'opacity-95' : '',
                  ].join(' ')
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  [
                    'rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition',
                    'hover:bg-slate-50 hover:text-slate-900',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2',
                    isActive ? 'bg-slate-50 text-slate-900' : '',
                  ].join(' ')
                }
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-200/50 to-transparent" />
    </header>
  );
}
