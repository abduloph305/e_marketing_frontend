import { useContext, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import { navigationItems } from '../../data/navigation.js'
import { roleLabels } from '../../data/permissions.js'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path d="M14 10a4 4 0 1 1-1.2-2.8L21 15v2h-2v2h-2v2h-2l-3.2-3.2A4 4 0 0 1 14 10Z" />
    </svg>
  )
}

function ChevronIcon({ open = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 fill-none stroke-current transition-transform ${open ? 'rotate-180' : ''}`}
      strokeWidth="1.8"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Sidebar() {
  const { admin, can, logout } = useContext(AuthContext)
  const toast = useContext(ToastContext)
  const visibleItems = navigationItems.filter((item) => can(item.permission))
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const groups = visibleItems.reduce((accumulator, item) => {
    const group = item.group || 'Workspace'
    accumulator[group] = accumulator[group] || []
    accumulator[group].push(item)
    return accumulator
  }, {})

  return (
    <aside className="sidebar-panel flex h-full min-h-0 flex-col overflow-hidden text-white">
      <div ref={menuRef} className="relative border-b border-white/8 p-4">
        <button
          type="button"
          onClick={() => setOpenMenu((current) => !current)}
          className="w-full rounded-[24px] border border-white/8 bg-white/6 p-3 text-left backdrop-blur-sm transition hover:bg-white/10"
        >
          <div className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-white/6 px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(99,91,255,0.18)] text-sm font-semibold text-white">
              {admin?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{roleLabels[admin?.role] || 'Super Admin'}</p>
              <p className="truncate text-xs text-slate-300">{admin?.email || 'admin@emarketing.local'}</p>
            </div>
            <div className="text-slate-400">
              <ChevronIcon open={openMenu} />
            </div>
          </div>
        </button>

        {openMenu ? (
          <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-50 overflow-hidden rounded-[18px] border border-white/8 bg-[#161b2b] shadow-[0_18px_42px_rgba(3,6,23,0.35)]">
            <div className="border-b border-white/8 px-4 py-3">
              <p className="text-[16px] font-semibold text-white">{admin?.name || 'Super Admin'}</p>
              <p className="mt-1 text-sm text-slate-300">{admin?.email}</p>
              <div className="mt-3 inline-flex rounded-full bg-[rgba(99,91,255,0.18)] px-3 py-1 text-xs font-semibold text-white">
                {roleLabels[admin?.role] || 'Super Admin'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.info('Profile page is not connected yet')}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white transition hover:bg-white/6"
            >
              <span className="flex items-center gap-3">
                <UserIcon />
                <span>Profile</span>
              </span>
              <span className="text-slate-400">View</span>
            </button>

            <button
              type="button"
              onClick={() => toast.info('Change password is not connected yet')}
              className="flex w-full items-center justify-between border-t border-white/8 px-4 py-3 text-left text-sm text-white transition hover:bg-white/6"
            >
              <span className="flex items-center gap-3">
                <KeyIcon />
                <span>Change Password</span>
              </span>
              <span className="text-slate-400">Edit</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-between border-t border-white/8 px-4 py-3 text-left text-sm text-white transition hover:bg-white/6"
            >
              <span>Sign out</span>
              <span className="text-slate-400">Exit</span>
            </button>
          </div>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {group}
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-xs font-semibold text-inherit">
                      {item.icon || '--'}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <span className="text-xs opacity-60">{'>'}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
