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

function Sidebar({ expanded = true, onHoverChange = () => {} }) {
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

  useEffect(() => {
    if (!expanded) {
      setOpenMenu(false)
    }
  }, [expanded])

  const groups = visibleItems.reduce((accumulator, item) => {
    const group = item.group || 'Workspace'
    accumulator[group] = accumulator[group] || []
    accumulator[group].push(item)
    return accumulator
  }, {})

  return (
    <aside
      className={`sidebar-panel flex h-full min-h-0 flex-col overflow-hidden text-white transition-[width] duration-200 ease-out ${
        expanded ? 'lg:w-[296px]' : 'lg:w-[72px]'
      } w-full`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div
        ref={menuRef}
        className={`relative border-b border-white/8 transition-all duration-200 ${
          expanded ? 'p-4' : 'p-2 lg:p-3'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpenMenu((current) => !current)}
          className={`w-full rounded-[24px] border border-white/8 bg-white/6 text-left backdrop-blur-sm transition hover:bg-white/10 ${
            expanded ? 'p-3' : 'p-2 lg:p-2'
          }`}
          title={expanded ? undefined : roleLabels[admin?.role] || 'Super Admin'}
        >
          <div
            className={`flex items-center rounded-[20px] border border-white/8 bg-white/6 transition-all duration-200 ${
              expanded ? 'gap-3 px-3 py-3' : 'justify-center gap-0 px-0 py-3'
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(99,91,255,0.18)] text-sm font-semibold text-white">
              {admin?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            {expanded ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{roleLabels[admin?.role] || 'Super Admin'}</p>
                  <p className="truncate text-xs text-slate-300">{admin?.email || 'admin@emarketing.local'}</p>
                </div>
                <div className="text-slate-400">
                  <ChevronIcon open={openMenu} />
                </div>
              </>
            ) : null}
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

      <nav
        className={`scrollbar-none min-h-0 flex-1 overflow-y-auto ${
          expanded ? 'space-y-5 px-3 py-4' : 'space-y-3 px-2 py-3 lg:px-2'
        }`}
      >
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {expanded ? (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {group}
              </p>
            ) : (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {group.slice(0, 2)}
              </p>
            )}
            <div className="space-y-2">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''} ${expanded ? '' : 'justify-center px-3'}`
                  }
                  title={expanded ? undefined : item.label}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-xs font-semibold text-inherit">
                      {item.icon || '--'}
                    </span>
                    {expanded ? <span>{item.label}</span> : null}
                  </span>
                  {expanded ? <span className="text-xs opacity-60">{'>'}</span> : null}
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
