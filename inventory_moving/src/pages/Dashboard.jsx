import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalInventory: 0,
    totalIn: 0,
    totalOut: 0,
    reorderItems: 0,
    fastMoving: [],
    slowMoving: [],
    deadStock: [],
    monthlyData: [],
    categoryData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('https://api-inventory.isavralabel.com/inventory-moving/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values if API fails
      setDashboardData({
        totalInventory: 0,
        totalIn: 0,
        totalOut: 0,
        reorderItems: 0,
        fastMoving: [],
        slowMoving: [],
        deadStock: [],
        monthlyData: [],
        categoryData: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const monthlyChartData = {
    labels: dashboardData.monthlyData.map(item => item.month) || [],
    datasets: [
      {
        label: 'Barang Masuk',
        data: dashboardData.monthlyData.map(item => item.total_in) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Barang Keluar',
        data: dashboardData.monthlyData.map(item => item.total_out) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: dashboardData.categoryData.map(item => item.category) || [],
    datasets: [
      {
        data: dashboardData.categoryData.map(item => item.total_items) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Data Bulanan Stok Barang',
      },
    },
  };

  const categoryOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribusi Barang per Kategori',
      },
    },
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Update terakhir: {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalInventory}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Masuk</p>
              <p className="text-2xl font-bold text-green-600">{dashboardData.totalIn}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowDownRight className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Keluar</p>
              <p className="text-2xl font-bold text-red-600">{dashboardData.totalOut}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ArrowUpRight className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reorder Alert</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.reorderItems}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Bar data={monthlyChartData} options={chartOptions} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Doughnut data={categoryChartData} options={categoryOptions} />
        </div>
      </div>

      {/* Stock Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Fast Moving</h3>
          </div>
          <div className="space-y-3">
            {dashboardData.fastMoving.length > 0 ? (
              dashboardData.fastMoving.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm text-green-600">{item.turnover_ratio ? Number(item.turnover_ratio).toFixed(2) : '0.00'}x</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Slow Moving</h3>
          </div>
          <div className="space-y-3">
            {dashboardData.slowMoving.length > 0 ? (
              dashboardData.slowMoving.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm text-yellow-600">{item.turnover_ratio ? Number(item.turnover_ratio).toFixed(2) : '0.00'}x</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Dead Stock</h3>
          </div>
          <div className="space-y-3">
            {dashboardData.deadStock.length > 0 ? (
              dashboardData.deadStock.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm text-red-600">0x</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Tidak ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;