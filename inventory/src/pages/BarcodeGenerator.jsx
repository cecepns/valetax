import { useState, useEffect, useRef } from 'react'
import { FiDownload, FiPrinter } from 'react-icons/fi'
import JsBarcode from 'jsbarcode'
import { useNotification } from '../contexts/NotificationContext'
import ProductSelect from '../components/ProductSelect'
import api from '../utils/api'

export default function BarcodeGenerator() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [barcodeData, setBarcodeData] = useState('')
  const [barcodeSize, setBarcodeSize] = useState('medium')
  const [includeText, setIncludeText] = useState(true)
  const canvasRef = useRef(null)
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    if (barcodeData) {
      generateBarcode()
    }
  }, [barcodeData, barcodeSize, includeText])

  const handleProductSelect = (product) => {
    if (product) {
      setSelectedProduct(product)
      setBarcodeData(product.barcode_id)
    } else {
      setSelectedProduct(null)
      setBarcodeData('')
    }
  }

  const generateBarcode = () => {
    if (!barcodeData || !canvasRef.current) return

    try {
      const sizeOptions = {
        small: { width: 1, height: 50 },
        medium: { width: 2, height: 80 },
        large: { width: 3, height: 120 }
      }

      JsBarcode(canvasRef.current, barcodeData, {
        format: "CODE128",
        ...sizeOptions[barcodeSize],
        fontSize: includeText ? 20 : 0,
        textMargin: 5,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000"
      })
    } catch {
      showError('Gagal membuat barcode')
    }
  }

  const downloadBarcode = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `barcode-${barcodeData}.png`
    link.href = canvas.toDataURL()
    link.click()
    
    // Log barcode generation
    if (selectedProduct) {
      await api.post('/api/barcode/generate', { product_code: selectedProduct.code })
    }
    
    showSuccess('Barcode berhasil diunduh')
  }

  const printBarcode = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; }
            img { max-width: 100%; height: auto; }
            .product-info { margin-bottom: 20px; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div class="product-info">
            ${selectedProduct ? `
              <h3>${selectedProduct.name}</h3>
              <p>Kode: ${selectedProduct.code}</p>
            ` : ''}
          </div>
          <img src="${dataUrl}" alt="Barcode" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    
    // Log barcode generation
    if (selectedProduct) {
      await api.post('/api/barcode/generate', { product_code: selectedProduct.code })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Generator Barcode</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barcode Configuration */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfigurasi Barcode</h3>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Pilih Produk</label>
              <ProductSelect
                value={selectedProduct?.code || ''}
                onChange={handleProductSelect}
                placeholder="Cari dan pilih produk..."
              />
            </div>
            
            <div>
              <label className="form-label">Atau Masukkan Barcode Manual</label>
              <input
                type="text"
                className="form-input"
                value={barcodeData}
                onChange={(e) => setBarcodeData(e.target.value)}
                placeholder="Masukkan data barcode..."
              />
            </div>
            
            <div>
              <label className="form-label">Ukuran Barcode</label>
              <select
                className="form-input"
                value={barcodeSize}
                onChange={(e) => setBarcodeSize(e.target.value)}
              >
                <option value="small">Kecil</option>
                <option value="medium">Sedang</option>
                <option value="large">Besar</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeText}
                  onChange={(e) => setIncludeText(e.target.checked)}
                  className="mr-2"
                />
                <span className="form-label">Tampilkan Teks</span>
              </label>
            </div>
          </div>
        </div>

        {/* Barcode Preview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Barcode</h3>
          
          <div className="text-center">
            {barcodeData ? (
              <div className="space-y-4">
                {selectedProduct && (
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium">
                      {selectedProduct.name}
                    </p>
                    <p>Kode: {selectedProduct.code}</p>
                  </div>
                )}
                
                <div className="bg-white p-4 border rounded-lg inline-block">
                  <canvas ref={canvasRef}></canvas>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={downloadBarcode}
                    className="btn btn-primary flex items-center"
                  >
                    <FiDownload className="mr-2" />
                    Download
                  </button>
                  <button
                    onClick={printBarcode}
                    className="btn btn-secondary flex items-center"
                  >
                    <FiPrinter className="mr-2" />
                    Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Pilih produk atau masukkan data barcode untuk membuat barcode</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barcode Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Panduan Penggunaan</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Pilih produk dari dropdown atau masukkan data barcode secara manual</p>
          <p>• Atur ukuran barcode sesuai kebutuhan (kecil, sedang, atau besar)</p>
          <p>• Centang &quot;Tampilkan Teks&quot; untuk menampilkan kode di bawah barcode</p>
          <p>• Klik &quot;Download&quot; untuk menyimpan barcode sebagai gambar PNG</p>
          <p>• Klik &quot;Print&quot; untuk mencetak barcode langsung</p>
          <p>• Tempel barcode yang sudah dicetak pada produk untuk memudahkan scanning</p>
        </div>
      </div>
    </div>
  )
}