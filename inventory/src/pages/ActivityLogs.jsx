import { useState, useEffect } from 'react'
import { FiActivity, FiSearch, FiUser, FiClock } from 'react-icons/fi'
import api from '../utils/api'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [uniqueActions, setUniqueActions] = useState([])

  // Fetch function for pagination
  const fetchLogs = async (params) => {
    const response = await api.get('/api/activity-logs', { 
      params: {
        ...params,
        action: filterAction
      }
    })
    return response
  }

  // Use pagination hook
  const {
    data: logs,
    loading: dataLoading,
    pagination,
    goToPage,
    updateParams,
    refresh
  } = usePagination(fetchLogs)

  useEffect(() => {
    fetchUniqueActions()
  }, [])

  // Update search params
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ search: searchTerm })
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Update filter
  useEffect(() => {
    refresh()
  }, [filterAction])

  const fetchUniqueActions = async () => {
    try {
      const response = await api.get('/api/activity-logs', {
        params: { limit: 1000 } // Get more logs to extract unique actions
      })
      // Correctly access the data structure based on API response
      const allLogs = response.data.data || response.data.items || response.data
      const actions = [...new Set(allLogs.map(log => log.action))].sort()
      setUniqueActions(actions)
    } catch (error) {
      console.error('Error fetching unique actions:', error)
    }
  }

  const getActionColor = (action) => {
    const colors = {
      'LOGIN': 'bg-blue-100 text-blue-800',
      'CREATE_PRODUCT': 'bg-green-100 text-green-800',
      'UPDATE_PRODUCT': 'bg-yellow-100 text-yellow-800',
      'DELETE_PRODUCT': 'bg-red-100 text-red-800',
      'INCOMING_GOODS': 'bg-green-100 text-green-800',
      'OUTGOING_GOODS': 'bg-red-100 text-red-800',
      'DAMAGED_GOODS': 'bg-orange-100 text-orange-800',
      'GENERATE_REPORT': 'bg-purple-100 text-purple-800',
      'GENERATE_BARCODE': 'bg-indigo-100 text-indigo-800',
      'CREATE_ORDER': 'bg-blue-100 text-blue-800',
      'UPDATE_ORDER': 'bg-yellow-100 text-yellow-800',
      'DELETE_ORDER': 'bg-red-100 text-red-800',
      'UPDATE_PEMBUKUAN': 'bg-green-100 text-green-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getActionLabel = (action) => {
    const labels = {
      'LOGIN': 'Login',
      'CREATE_PRODUCT': 'Buat Produk',
      'UPDATE_PRODUCT': 'Update Produk',
      'DELETE_PRODUCT': 'Hapus Produk',
      
      'INCOMING_GOODS': 'Barang Masuk',
      'OUTGOING_GOODS': 'Barang Keluar',
      'DAMAGED_GOODS': 'Barang Rusak',
      'UPDATE_DAMAGED_GOODS': 'Update Barang Rusak',
      'DELETE_DAMAGED_GOODS': 'Hapus Barang Rusak',
      'GENERATE_REPORT': 'Generate Laporan',
      'GENERATE_BARCODE': 'Generate Barcode',
      'CREATE_ORDER': 'Buat Order',
      'UPDATE_ORDER': 'Update Order',
      'DELETE_ORDER': 'Hapus Order',
      'UPDATE_PEMBUKUAN': 'Update Pembukuan'
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas</h1>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} aktivitas
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="form-input"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">Semua Aktivitas</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="card">
        {dataLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiUser className="mr-1" size={14} />
                          {log.user_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiClock className="mr-1" size={14} />
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <p className="text-gray-800">{log.details}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.user_email}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-center py-8">
                  <FiActivity className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Tidak ada log aktivitas ditemukan</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {uniqueActions.slice(0, 4).map(action => {
          const count = logs.filter(log => log.action === action).length
          return (
            <div key={action} className="card bg-white">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600">{getActionLabel(action)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}