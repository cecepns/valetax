import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  FiHome, 
  FiPackage, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertTriangle, 
  FiBarChart, 
  FiLogOut,
  FiMenu,
  FiX,
  FiShoppingCart,
  FiSettings,
  FiDollarSign,
  FiActivity
} from 'react-icons/fi'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, hasRole, hasAnyRole } = useAuth()
  const location = useLocation()

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FiHome, roles: ['admin', 'manager'] },
    { path: '/products', name: 'Data Produk', icon: FiPackage, roles: ['manager'] },
    { path: '/incoming-goods', name: 'Barang Masuk', icon: FiTrendingUp, roles: ['admin', 'manager'] },
    { path: '/outgoing-goods', name: 'Barang Keluar', icon: FiTrendingDown, roles: ['admin', 'manager'] },
    { path: '/damaged-goods', name: 'Barang Rusak', icon: FiAlertTriangle, roles: ['admin', 'manager'] },
    { path: '/barcode-generator', name: 'Buat Barcode', icon: FiSettings, roles: ['manager'] },
    { path: '/reports', name: 'Laporan', icon: FiBarChart, roles: ['admin', 'manager'] },
    { path: '/order-list', name: 'List Order', icon: FiShoppingCart, roles: ['manager'] },
    { path: '/pembukuan', name: 'Pembukuan', icon: FiDollarSign, roles: ['manager'] },
    { path: '/activity-logs', name: 'Log Aktivitas', icon: FiActivity, roles: ['manager'] },
  ]

  const filteredMenuItems = menuItems.filter(item => hasAnyRole(item.roles))

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gradient">INVENTORY FOSLY</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <nav className="mt-4 px-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3" size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <FiLogOut className="mr-3" size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <FiMenu size={24} />
            </button>
            
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {filteredMenuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}