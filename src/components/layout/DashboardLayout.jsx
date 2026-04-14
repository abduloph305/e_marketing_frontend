import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

function DashboardLayout() {
  return (
    <div className="h-screen overflow-hidden bg-transparent">
      <div className="grid h-full overflow-hidden bg-[var(--bg-page-soft)] lg:grid-cols-[296px_minmax(0,1fr)]">
        <Sidebar />
        <main className="flex min-w-0 min-h-0 flex-col overflow-hidden bg-transparent">
          <Topbar />
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 xl:p-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
