import { useState, useEffect, useRef } from 'react'
import { FiDownload, FiPrinter, FiBarChart } from 'react-icons/fi'
import api from '../utils/api'
import { useNotification } from '../contexts/NotificationContext'
import { useReactToPrint } from 'react-to-print'

export default function Reports() {
  const [reportData, setReportData] = useState({
    stockReport: [],
    incomingReport: [],
    outgoingReport: []
  })
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('stock')
  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return sevenDaysAgo.toISOString().split('T')[0]
    })(),
    endDate: (() => {
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return sevenDaysFromNow.toISOString().split('T')[0]
    })(),
  })
  const { showSuccess, showError } = useNotification()
  const printRef = useRef()

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Laporan ${reportType === 'stock' ? 'Stok' : reportType === 'incoming' ? 'Barang Masuk' : 'Barang Keluar'}`,
  })

  useEffect(() => {
    fetchReports()
  }, [reportType, dateRange])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }
      
      // Untuk laporan stock: tampilkan semua produk dengan total transaksi dalam rentang tanggal
      // Untuk laporan incoming/outgoing: hanya tampilkan transaksi dalam rentang tanggal
      if (reportType === 'stock') {
        params.includeEmpty = true
      } else {
        params.includeEmpty = false
      }
      
      const response = await api.get('/api/reports', { params })
      setReportData(response.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
      showError('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    let data = []
    let headers = []
    
    const currentReport = getCurrentReport() || []
    
    switch (reportType) {
      case 'stock':
        headers = ['Kode', 'Nama Barang', 'Kategori', 'Merk', 'Stok di Awal Periode', 'Barang Masuk', 'Barang Keluar', 'Stok Akhir']
        data = currentReport.map(item => [
          item.code,
          item.name,
          item.category,
          item.brand,
          item.stock_at_start,
          item.total_incoming,
          item.total_outgoing,
          item.calculated_stock
        ])
        break
      case 'incoming':
        headers = ['Tanggal', 'Kode', 'Nama Barang', 'Kategori', 'Merk', 'Jumlah', 'Platform', 'Resi']
        data = currentReport.map(item => [
          new Date(item.date).toLocaleDateString('id-ID'),
          item.product_code,
          item.product_name,
          item.category,
          item.brand,
          item.quantity,
          item.platform,
          item.resi_number
        ])
        break
      case 'outgoing':
        headers = ['Tanggal', 'Kode', 'Nama Barang', 'Kategori', 'Merk', 'Jumlah', 'Resi']
        data = currentReport.map(item => [
          new Date(item.date).toLocaleDateString('id-ID'),
          item.product_code,
          item.product_name,
          item.category,
          item.brand,
          item.quantity,
          item.resi_number
        ])
        break
    }

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-${reportType}-${dateRange.startDate}-${dateRange.endDate}.csv`
    link.click()
    
    showSuccess('Laporan berhasil diunduh')
  }

  const getCurrentReport = () => {
    switch (reportType) {
      case 'stock':
        return reportData.stockReport || []
      case 'incoming':
        return reportData.incomingReport || []
      case 'outgoing':
        return reportData.outgoingReport || []
      default:
        return []
    }
  }

  const getReportTitle = () => {
    switch (reportType) {
      case 'stock':
        return 'Laporan Stok Barang'
      case 'incoming':
        return 'Laporan Barang Masuk'
      case 'outgoing':
        return 'Laporan Barang Keluar'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="btn btn-success flex items-center"
          >
            <FiDownload className="mr-2" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary flex items-center"
          >
            <FiPrinter className="mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Jenis Laporan</label>
            <select
              className="form-input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="stock">Laporan Stok</option>
              <option value="incoming">Laporan Barang Masuk</option>
              <option value="outgoing">Laporan Barang Keluar</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Tanggal Mulai</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </div>
          
          <div>
            <label className="form-label">Tanggal Akhir</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="card">
        <div ref={printRef} className="print-content">
          {/* Print Header */}
          <div className="print-header mb-6 text-center">
            <h2 className="text-xl font-bold">{getReportTitle()}</h2>
            <p className="text-gray-600">
              Periode: {new Date(dateRange.startDate).toLocaleDateString('id-ID')} - {new Date(dateRange.endDate).toLocaleDateString('id-ID')}
            </p>
            <p className="text-gray-600">
              Dicetak pada: {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {reportType === 'stock' && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama Barang</th>
                      <th>Kategori</th>
                      <th>Merk</th>
                      <th>Stok di Awal Periode</th>
                      <th>Masuk</th>
                      <th>Keluar</th>
                      <th>Stok Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getCurrentReport() || []).map((item, index) => (
                      <tr key={index}>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>{item.brand}</td>
                        <td>{item.stock_at_start}</td>
                        <td className="text-green-600">+{item.total_incoming || 0}</td>
                        <td className="text-red-600">-{item.total_outgoing || 0}</td>
                        <td>
                          <span className={`font-semibold ${
                            item.calculated_stock <= 0 ? 'text-red-600' : 
                            item.calculated_stock <= 10 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {item.calculated_stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'incoming' && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kode</th>
                      <th>Nama Barang</th>
                      <th>Kategori</th>
                      <th>Merk</th>
                      <th>Jumlah</th>
                      <th>Platform</th>
                      <th>Resi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getCurrentReport() || []).map((item, index) => (
                      <tr key={index}>
                        <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                        <td>{item.product_code}</td>
                        <td>{item.product_name}</td>
                        <td>{item.category}</td>
                        <td>{item.brand}</td>
                        <td className="text-green-600 font-semibold">+{item.quantity}</td>
                        <td>{item.platform}</td>
                        <td>{item.resi_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'outgoing' && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kode</th>
                      <th>Nama Barang</th>
                      <th>Kategori</th>
                      <th>Merk</th>
                      <th>Jumlah</th>
                      <th>Resi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getCurrentReport() || []).map((item, index) => (
                      <tr key={index}>
                        <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                        <td>{item.product_code}</td>
                        <td>{item.product_name}</td>
                        <td>{item.category}</td>
                        <td>{item.brand}</td>
                        <td className="text-red-600 font-semibold">-{item.quantity}</td>
                        <td>{item.resi_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {(getCurrentReport() || []).length === 0 && (
                <div className="text-center py-8">
                  <FiBarChart className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Tidak ada data untuk periode yang dipilih</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}