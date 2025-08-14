import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import axios from 'axios';

const Report = () => {
  const [reportData, setReportData] = useState({
    stockReport: [],
    fastMoving: [],
    slowMoving: [],
    deadStock: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await axios.get('https://api-inventory.isavralabel.com/inventory-moving/api/reports');
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'stock', name: 'Stok Akhir', icon: FileText },
    { id: 'fast', name: 'Fast Moving', icon: TrendingUp },
    { id: 'slow', name: 'Slow Moving', icon: TrendingDown },
    { id: 'dead', name: 'Dead Stock', icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Report</h1>
        <div className="text-sm text-gray-500">
          Generated: {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={16} />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Stock Report */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Laporan Stok Akhir</h3>
                <button
                  onClick={() => exportToCSV(reportData.stockReport, 'stock-report')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Barang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Saat Ini
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min. Stok
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.stockReport.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.min_stock} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.current_stock <= item.min_stock
                              ? 'bg-red-100 text-red-800'
                              : item.current_stock <= item.min_stock * 1.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.current_stock <= item.min_stock
                              ? 'Reorder'
                              : item.current_stock <= item.min_stock * 1.5
                              ? 'Low Stock'
                              : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {reportData.stockReport.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada data yang ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fast Moving */}
          {activeTab === 'fast' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Barang Fast Moving</h3>
                <button
                  onClick={() => exportToCSV(reportData.fastMoving, 'fast-moving-report')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-green-700">
                  <strong>Kriteria:</strong> Barang dengan turnover ratio ≥ 2.0 (barang keluar 2x atau lebih dari rata-rata stok)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ranking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Barang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Keluar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Turnover Ratio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.fastMoving.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-gray-500">{item.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.total_out} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {Number(item.turnover_ratio || 0).toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {reportData.fastMoving.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada barang fast moving</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slow Moving */}
          {activeTab === 'slow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Barang Slow Moving</h3>
                <button
                  onClick={() => exportToCSV(reportData.slowMoving, 'slow-moving-report')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-sm text-yellow-700">
                  <strong>Kriteria:</strong> Barang dengan turnover ratio 0.5 - 1.9 (pergerakan lambat)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Barang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Keluar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Turnover Ratio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rekomendasi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.slowMoving.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-gray-500">{item.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.total_out} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {Number(item.turnover_ratio || 0).toFixed(2)}x
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          Kurangi pembelian
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {reportData.slowMoving.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada barang slow moving</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dead Stock */}
          {activeTab === 'dead' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Dead Stock</h3>
                <button
                  onClick={() => exportToCSV(reportData.deadStock, 'dead-stock-report')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-700">
                  <strong>Kriteria:</strong> Barang dengan turnover ratio 0 atau tidak ada pergerakan dalam 6 bulan terakhir
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Barang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Tersisa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Terakhir Keluar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nilai Stok
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.deadStock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-gray-500">{item.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.last_out_date ? new Date(item.last_out_date).toLocaleDateString('id-ID') : 'Tidak pernah'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {(item.current_stock * item.price).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {reportData.deadStock.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada dead stock</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;