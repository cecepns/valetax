import { useState, useEffect, useCallback, useRef } from 'react'
import { FiPlus, FiTrendingDown, FiSearch, FiAlertTriangle, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi'
import api from '../utils/api'
import { useNotification } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'
import ProductSelect from '../components/ProductSelect'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

export default function OutgoingGoods() {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productsData, setProductsData] = useState({})
  const [productsLoading, setProductsLoading] = useState(false)
  const [resiDuplicateStatus, setResiDuplicateStatus] = useState({})
  const [barcodeError, setBarcodeError] = useState('')
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    category: '',
    brand: '',
    resi_number: '',
    quantity: '',
    barcode: '',
    date: new Date().toISOString().split('T')[0]
  })
  const { showSuccess, showError } = useNotification()
  const { hasRole } = useAuth()

  // Add refs for debouncing
  const resiCheckTimeoutRef = useRef(null)
  const barcodeCheckTimeoutRef = useRef(null)

  // Fetch function for pagination
  const fetchOutgoingGoods = useCallback(async (params) => {
    const response = await api.get('/api/outgoing-goods', { params })
    return response
  }, [])

  // Use pagination hook
  const {
    data: outgoingGoods,
    loading: dataLoading,
    pagination,
    goToPage,
    updateParams,
    refresh
  } = usePagination(fetchOutgoingGoods)

  // Fetch products data for stock information
  const fetchProductsData = useCallback(async () => {
    setProductsLoading(true)
    try {
      const response = await api.get('/api/products/all')
      const products = response.data.data || []
      const productsMap = {}
      products.forEach(product => {
        productsMap[product.code] = product
      })
      setProductsData(productsMap)
    } catch (error) {
      console.error('Error fetching products data:', error)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  // Fetch products data when component mounts and when outgoing goods refresh
  useEffect(() => {
    fetchProductsData()
  }, [fetchProductsData])

  // Refresh products data when outgoing goods data changes
  useEffect(() => {
    if (outgoingGoods.length > 0) {
      fetchProductsData()
    }
  }, [outgoingGoods, fetchProductsData])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (resiCheckTimeoutRef.current) {
        clearTimeout(resiCheckTimeoutRef.current)
      }
      if (barcodeCheckTimeoutRef.current) {
        clearTimeout(barcodeCheckTimeoutRef.current)
      }
    }
  }, [])

  // Update search params
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ search: searchTerm })
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Function to check for duplicate resi numbers with debouncing
  const checkDuplicateResi = async (resiNumber, excludeId = null) => {
    if (!resiNumber || resiNumber.trim() === '') {
      setResiDuplicateStatus(prev => ({ ...prev, [resiNumber]: false }))
      return false
    }
    
    try {
      const params = new URLSearchParams()
      if (excludeId) params.append('excludeId', excludeId)
      
      const response = await api.get(`/api/outgoing-goods/check-resi/${resiNumber}?${params}`)
      const isDuplicate = response.data.isDuplicate
      setResiDuplicateStatus(prev => ({ ...prev, [resiNumber]: isDuplicate }))
      return isDuplicate
    } catch (error) {
      console.error('Error checking resi number:', error)
      setResiDuplicateStatus(prev => ({ ...prev, [resiNumber]: false }))
      return false
    }
  }

  // Debounced resi check function
  const debouncedCheckResi = useCallback((resiNumber, excludeId = null) => {
    // Clear existing timeout
    if (resiCheckTimeoutRef.current) {
      clearTimeout(resiCheckTimeoutRef.current)
    }
    
    // Set new timeout
    resiCheckTimeoutRef.current = setTimeout(() => {
      checkDuplicateResi(resiNumber, excludeId)
    }, 500)
  }, [])

  // Function to get duplicate count for a resi number
  const getDuplicateCount = (resiNumber) => {
    if (!resiNumber) return 0
    return outgoingGoods.filter(item => item.resi_number === resiNumber).length
  }

  // Function to check if item can be edited (only managers)
  const canEditItem = () => {
    return hasRole('manager')
  }

  const getEditTooltip = () => {
    const isManager = hasRole('manager')
    
    if (!isManager) {
      return 'Hanya manager yang dapat mengedit data'
    }
    return 'Edit'
  }

  const getDeleteTooltip = () => {
    const isManager = hasRole('manager')
    
    if (!isManager) {
      return 'Hanya manager yang dapat menghapus data'
    }
    return 'Hapus'
  }

  // Function to check if quantity exceeds available stock
  const checkStockAvailability = (quantity) => {
    if (!selectedProduct || !quantity) return true
    const availableStock = selectedProduct.current_stock
    return parseInt(quantity) <= availableStock
  }

  // Function to get stock status
  const getStockStatus = () => {
    if (!selectedProduct) return null
    
    const stock = selectedProduct.current_stock
    if (stock <= 0) {
      return { status: 'out-of-stock', message: 'Stok habis', color: 'text-red-600' }
    } else if (stock <= 10) {
      return { status: 'low-stock', message: `Stok tersisa: ${stock}`, color: 'text-yellow-600' }
    } else {
      return { status: 'available', message: `Stok tersedia: ${stock}`, color: 'text-green-600' }
    }
  }

  // Function to get stock status for table display
  const getStockStatusForTable = (productCode) => {
    if (productsLoading) {
      return { status: 'loading', message: 'Loading...', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
    
    const product = productsData[productCode]
    if (!product) {
      return { status: 'unknown', message: 'N/A', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
    
    const stock = product.current_stock
    if (stock <= 0) {
      return { status: 'out-of-stock', message: 'Stok habis', color: 'text-red-600', bgColor: 'bg-red-50' }
    } else if (stock <= 10) {
      return { status: 'low-stock', message: `Stok: ${stock}`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else {
      return { status: 'available', message: `Stok: ${stock}`, color: 'text-green-600', bgColor: 'bg-green-50' }
    }
  }

  const handleProductChange = (product) => {
    setSelectedProduct(product)
    if (product) {
      setFormData({
        ...formData,
        product_code: product.code,
        product_name: product.name,
        category: product.category,
        brand: product.brand
      })
      
      // Reset quantity if it exceeds available stock
      if (parseInt(formData.quantity) > product.current_stock) {
        setFormData(prev => ({ ...prev, quantity: '' }))
      }
    } else {
      setSelectedProduct(null)
      setFormData({
        ...formData,
        product_code: '',
        product_name: '',
        category: '',
        brand: ''
      })
    }
  }

  const handleBarcodeChange = async (barcode) => {
    setBarcodeInput(barcode)
    setFormData({...formData, barcode})
    setBarcodeError('') // Clear previous error
    
    // Look up product by barcode
    if (barcode && barcode.trim()) {
      try {
        const response = await api.get(`/api/products/barcode/${barcode}`)
        const product = response.data.data
        
        // Auto-select the product
        handleProductChange(product)
      } catch {
        // Barcode not found, clear product selection and show error
        handleProductChange(null)
        setBarcodeError('Barcode tidak ditemukan dalam database')
      }
    } else {
      // Clear barcode, clear product selection
      handleProductChange(null)
    }
  }

  // Immediate barcode input handler for typing
  const handleBarcodeInputChange = (value) => {
    setBarcodeInput(value)
    setFormData({...formData, barcode: value})
    setBarcodeError('')
    
    // Clear product selection when barcode is cleared
    if (!value || !value.trim()) {
      handleProductChange(null)
    }
    
    // Debounce the API call
    if (barcodeCheckTimeoutRef.current) {
      clearTimeout(barcodeCheckTimeoutRef.current)
    }
    
    barcodeCheckTimeoutRef.current = setTimeout(() => {
      if (value && value.trim()) {
        handleBarcodeChange(value)
      }
    }, 500)
  }

  const handleEdit = (item) => {
    if (!canEditItem()) {
      showError('Hanya manager yang dapat mengedit data')
      return
    }
    
    // Fix timezone issue by using local date string
    const formatDateForInput = (dateString) => {
      if (!dateString) return new Date().toISOString().split('T')[0]
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Note: Product lookup would need to be implemented with API call
    setSelectedProduct(null)
    
    setEditingItem(item)
    setFormData({
      product_code: item.product_code,
      product_name: item.product_name,
      category: item.category,
      brand: item.brand,
      resi_number: item.resi_number,
      quantity: item.quantity,
      barcode: item.barcode,
      date: formatDateForInput(item.date)
    })
    setBarcodeInput(item.barcode)
    setShowForm(true)
    setResiDuplicateStatus({})
    setBarcodeError('')
  }

  const handleDelete = async (item) => {
    if (!canEditItem()) {
      if (!hasRole('manager')) {
        showError('Hanya manager yang dapat menghapus data')
      } else {
        showError('Hanya dapat menghapus data hari ini')
      }
      return
    }
    
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return
    }

    try {
      await api.delete(`/api/outgoing-goods/${item.id}`)
      showSuccess('Data berhasil dihapus')
      refresh()
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal menghapus data')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check for duplicate resi number (exclude current item if editing)
    const isDuplicate = await checkDuplicateResi(formData.resi_number, editingItem?.id)
    if (isDuplicate) {
      showError('Nomor resi sudah digunakan sebelumnya!')
      return
    }
    
    // Validate barcode matches selected product
    if (formData.barcode && selectedProduct && formData.barcode !== selectedProduct.barcode_id) {
      showError('Barcode tidak sesuai dengan produk yang dipilih!')
      return
    }

    // Frontend stock validation
    if (!checkStockAvailability(formData.quantity)) {
      showError(`Stok tidak mencukupi. Stok tersedia: ${selectedProduct.current_stock}`)
      return
    }

    setLoading(true)

    try {
      if (editingItem) {
        // Update existing record
        await api.put(`/api/outgoing-goods/${editingItem.id}`, formData)
        showSuccess('Data berhasil diperbarui')
      } else {
        // Create new record
        await api.post('/api/outgoing-goods', formData)
        showSuccess('Barang keluar berhasil ditambahkan')
      }
      resetForm()
      refresh()
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      product_code: '',
      product_name: '',
      category: '',
      brand: '',
      resi_number: '',
      quantity: '',
      barcode: '',
      date: new Date().toISOString().split('T')[0]
    })
    setBarcodeInput('')
    setSelectedProduct(null)
    setEditingItem(null)
    setShowForm(false)
    setResiDuplicateStatus({})
    setBarcodeError('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Barang Keluar</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-danger flex items-center"
        >
          <FiPlus className="mr-2" />
          Tambah Barang Keluar
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari barang keluar..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Barang Keluar' : 'Tambah Barang Keluar'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Tanggal</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Pilih Produk</label>
                <ProductSelect
                  value={formData.product_code}
                  onChange={handleProductChange}
                  placeholder="Cari dan pilih produk..."
                />
              </div>
              
              {/* Stock Information */}
              {selectedProduct && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiPackage className="text-gray-500" size={16} />
                    <span className="text-sm font-medium text-gray-700">Informasi Stok:</span>
                  </div>
                  <div className={`text-sm font-medium mt-1 ${getStockStatus()?.color}`}>
                    {getStockStatus()?.message}
                  </div>
                  {selectedProduct.current_stock <= 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      Tidak dapat menambahkan barang keluar untuk produk ini
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="form-label">Nama Barang</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.product_name}
                  readOnly
                />
              </div>
              
              <div>
                <label className="form-label">Kategori</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  readOnly
                />
              </div>
              
              <div>
                <label className="form-label">Merk</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.brand}
                  readOnly
                />
              </div>
              
              <div>
                <label className="form-label">Nomor Resi</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`form-input ${resiDuplicateStatus[formData.resi_number] ? 'border-red-500 bg-red-50' : ''}`}
                    value={formData.resi_number}
                    onChange={(e) => {
                      const newResiNumber = e.target.value
                      setFormData({...formData, resi_number: newResiNumber})
                      // Check for duplicates when resi number changes with debouncing
                      if (newResiNumber.trim()) {
                        debouncedCheckResi(newResiNumber, editingItem?.id)
                      } else {
                        setResiDuplicateStatus(prev => ({ ...prev, [newResiNumber]: false }))
                      }
                    }}
                    required
                  />
                  {resiDuplicateStatus[formData.resi_number] && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiAlertTriangle className="text-red-500" size={20} />
                    </div>
                  )}
                </div>
                {resiDuplicateStatus[formData.resi_number] && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <FiAlertTriangle className="mr-1" size={14} />
                    Nomor resi ini sudah digunakan sebelumnya!
                  </p>
                )}
              </div>
              
              <div>
                <label className="form-label">Jumlah</label>
                <div className="relative">
                  <input
                    type="number"
                    className={`form-input ${!checkStockAvailability(formData.quantity) ? 'border-red-500 bg-red-50' : ''}`}
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    min="1"
                    max={selectedProduct ? selectedProduct.current_stock : undefined}
                    disabled={selectedProduct && selectedProduct.current_stock <= 0}
                    required
                  />
                  {!checkStockAvailability(formData.quantity) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiAlertTriangle className="text-red-500" size={20} />
                    </div>
                  )}
                </div>
                {!checkStockAvailability(formData.quantity) && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <FiAlertTriangle className="mr-1" size={14} />
                    Jumlah melebihi stok yang tersedia!
                  </p>
                )}
                {selectedProduct && selectedProduct.current_stock > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Maksimal: {selectedProduct.current_stock} unit
                  </p>
                )}
              </div>
              
              <div>
                <label className="form-label">Barcode (Scan Required)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className={`form-input flex-1 ${barcodeError ? 'border-red-500 bg-red-50' : ''}`}
                    value={barcodeInput}
                    onChange={(e) => handleBarcodeInputChange(e.target.value)}
                    placeholder="Masukan barcode"
                    required
                  />
                </div>
                {barcodeError && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <FiAlertTriangle className="mr-1" size={14} />
                    {barcodeError}
                  </p>
                )}
                {barcodeInput && !barcodeError && (
                  <p className="text-sm text-gray-600 mt-1">
                    Barcode: {barcodeInput}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || 
                    resiDuplicateStatus[formData.resi_number] || 
                    !checkStockAvailability(formData.quantity) ||
                    (selectedProduct && selectedProduct.current_stock <= 0) ||
                    barcodeError
                  }
                  className="btn btn-danger"
                >
                  {loading ? 'Menyimpan...' : (editingItem ? 'Update' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outgoing Goods Table */}
      <div className="card">
        {dataLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Barcode</th>
                    <th>Kode Barang</th>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Merk</th>
                    <th>Stok Saat Ini</th>
                    <th>Nomor Resi</th>
                    <th>Jumlah</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoingGoods.map((item) => {
                    const isDuplicate = getDuplicateCount(item.resi_number) > 1
                    const canEdit = canEditItem()
                    return (
                      <tr 
                        key={item.id} 
                        className={isDuplicate ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
                      >
                        <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                        <td>{item.barcode}</td>
                        <td>{item.product_code}</td>
                        <td>{item.product_name}</td>
                        <td>{item.category}</td>
                        <td>{item.brand}</td>
                        <td>
                          {(() => {
                            const stockStatus = getStockStatusForTable(item.product_code)
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                                {stockStatus.message}
                              </span>
                            )
                          })()}
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <span className={isDuplicate ? 'text-red-700 font-medium' : ''}>
                              {item.resi_number}
                            </span>
                            {isDuplicate && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center">
                                <FiAlertTriangle className="mr-1" size={12} />
                                Duplikat
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            -{item.quantity}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-2 items-center">
                            <button
                              onClick={() => handleEdit(item)}
                              disabled={!canEdit}
                              className={`rounded-lg transition-colors ${
                                canEdit 
                                  ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={getEditTooltip()}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={!canEdit}
                              className={`rounded-lg transition-colors ${
                                canEdit 
                                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={getDeleteTooltip()}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {outgoingGoods.length === 0 && (
                <div className="text-center py-8">
                  <FiTrendingDown className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Tidak ada data barang keluar</p>
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
    </div>
  )
}