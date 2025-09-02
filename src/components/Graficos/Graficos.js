import React, { useState, useEffect } from 'react';
import { Doughnut, Line, Bar, Pie } from 'react-chartjs-2';
import Papa from 'papaparse';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../AuthWrapper/AuthWrapper';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import './Graficos.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
);

const Graficos = ({ onLogout }) => {
  const [ventas, setVentas] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availablePayments, setAvailablePayments] = useState([]);

  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { categoryFilter, setCategoryFilter, categorySearchTerm, setCategorySearchTerm } = useAuth();

  useEffect(() => {
    Papa.parse('/ventas.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: ';',
      complete: (result) => {
        setVentas(result.data);
        const uniqueCategories = [...new Set(result.data.map(v => v.Categoría).filter(Boolean))];
        setAvailableCategories(uniqueCategories);

        // Years
        const uniqueYears = [
          ...new Set(
            result.data
              .map(v => {
                if (!v.Fecha) return null;
                const parts = v.Fecha.split('/');
                return parts.length === 3 ? parts[2] : null;
              })
              .filter(Boolean)
          ),
        ];
        setAvailableYears(uniqueYears);

        // Months
        const uniqueMonths = [
          ...new Set(
            result.data
              .map(v => {
                if (!v.Fecha) return null;
                const parts = v.Fecha.split('/');
                return parts.length === 3 ? parts[1] : null;
              })
              .filter(Boolean)
          ),
        ];
        setAvailableMonths(uniqueMonths);

        // Payment methods
        const uniquePayments = [
          ...new Set(result.data.map(v => v.Pago).filter(Boolean)),
        ];
        setAvailablePayments(uniquePayments);
      },
    });
  }, []);

  // Función para manejar la carga de un nuevo archivo CSV
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: ';',
        complete: (result) => {
          setVentas(result.data);
          setCategoryFilter('');
          setCategorySearchTerm('');
          setYearFilter('');
          setMonthFilter('');
          setPaymentFilter('');
          const uniqueCategories = [...new Set(result.data.map(v => v.Categoría).filter(Boolean))];
          setAvailableCategories(uniqueCategories);

          // Years
          const uniqueYears = [
            ...new Set(
              result.data
                .map(v => {
                  if (!v.Fecha) return null;
                  const parts = v.Fecha.split('/');
                  return parts.length === 3 ? parts[2] : null;
                })
                .filter(Boolean)
            ),
          ];
          setAvailableYears(uniqueYears);

          // Months
          const uniqueMonths = [
            ...new Set(
              result.data
                .map(v => {
                  if (!v.Fecha) return null;
                  const parts = v.Fecha.split('/');
                  return parts.length === 3 ? parts[1] : null;
                })
                .filter(Boolean)
            ),
          ];
          setAvailableMonths(uniqueMonths);

          // Payment methods
          const uniquePayments = [
            ...new Set(result.data.map(v => v.Pago).filter(Boolean)),
          ];
          setAvailablePayments(uniquePayments);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error al procesar el archivo CSV. Asegúrate de que el formato sea correcto.');
        },
      });
    }
  };

  // Datos para los gráficos y estadísticas (usa categoryFilter, yearFilter, monthFilter, paymentFilter para filtrar)
  const datosParaCalculos = ventas.filter(v => {
    let match = true;
    if (categoryFilter.trim() !== "") {
      match = match && (v.Categoría || "").toLowerCase().includes(categoryFilter.toLowerCase());
    }
    if (yearFilter.trim() !== "") {
      if (!v.Fecha) return false;
      const parts = v.Fecha.split('/');
      match = match && parts.length === 3 && parts[2] === yearFilter;
    }
    if (monthFilter.trim() !== "") {
      if (!v.Fecha) return false;
      const parts = v.Fecha.split('/');
      match = match && parts.length === 3 && parts[1] === monthFilter;
    }
    if (paymentFilter.trim() !== "") {
      match = match && (v.Pago || "") === paymentFilter;
    }
    return match;
  });

  // Función para manejar el cambio en la selección de categoría
  const handleSearchTermChange = (e) => {
    const selectedCategory = e.target.value;
    setCategorySearchTerm(selectedCategory);
    setCategoryFilter(selectedCategory);
  };

  // Función para manejar el cambio en el filtro de año
  const handleYearChange = (e) => {
    setYearFilter(e.target.value);
  };

  // Función para manejar el cambio en el filtro de mes
  const handleMonthChange = (e) => {
    setMonthFilter(e.target.value);
  };

  // Función para manejar el cambio en el filtro de método de pago
  const handlePaymentChange = (e) => {
    setPaymentFilter(e.target.value);
  };

  // ---- Cálculos de estadísticas ----
  const cantidadTotalVendida = datosParaCalculos.reduce((acc, v) => acc + (v.Cantidad || 0), 0);
  const totalComprobantes = datosParaCalculos.length;
  const totalVentas = datosParaCalculos.reduce((acc, v) => acc + (v.Total || 0), 0);
  const gananciaNeta = datosParaCalculos.reduce((acc, v) => acc + ((v.Total || 0) - (v.Costo || 0)), 0);
  const margenDeGanancia = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0;

  // ---- Gráfico de pastel (ventas por categoría/producto) ----
  let chartLabels;
  let chartValues;
  let doughnutChartTitle;

  if (categoryFilter.trim() !== "") {
    // Si hay filtro, mostrar ventas por producto dentro de la categoría filtrada
    const productoPorCategoriaMap = {};
    datosParaCalculos.forEach(v => {
      if (!v.Producto || !v.Total) return;
      productoPorCategoriaMap[v.Producto] = (productoPorCategoriaMap[v.Producto] || 0) + (v.Total || 0);
    });
    chartLabels = Object.keys(productoPorCategoriaMap);
    chartValues = Object.values(productoPorCategoriaMap);
    doughnutChartTitle = `Ventas por Producto (Filtro: ${categoryFilter})`;
  } else {
    // Si no hay filtro, mostrar ventas por categoría general
    const categoriaMap = {};
    datosParaCalculos.forEach(v => {
      if (!v.Categoría) return;
      categoriaMap[v.Categoría] = (categoriaMap[v.Categoría] || 0) + (v.Total || 0);
    });
    chartLabels = Object.keys(categoriaMap);
    chartValues = Object.values(categoriaMap);
    doughnutChartTitle = `Ventas por Categoría (Todas)`;
  }

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9900', '#00CC99', '#FF6666'],
        borderWidth: 0,
      },
    ],
  };
  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 15, padding: 15, color: '#ffffff' },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
    responsive: true,
  };

  // ---- Gráfico de líneas (ventas por método de pago) ----
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const pagoData = {};
  datosParaCalculos.forEach(v => {
    if (!v.Fecha || !v.Total) return;
    const [, mes, ] = v.Fecha.split("/");
    const mesIdx = parseInt(mes, 10) - 1;
    const metodo = v.Pago || "Otro";
    if (!pagoData[metodo]) pagoData[metodo] = Array(12).fill(0);
    pagoData[metodo][mesIdx] += (v.Total || 0);
  });
  const lineData = {
    labels: meses,
    datasets: Object.keys(pagoData).map((metodo, idx) => ({
      label: metodo,
      data: pagoData[metodo],
      fill: false,
      borderColor: ['#36A2EB','#FF6384','#4BC0C0','#9966FF', '#FF9900', '#00CC99', '#FF6666'][idx % 6],
      tension: 0.1,
    })),
  };
  const lineOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15, color: '#ffffff' } },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' }
      },
      x: { 
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  // ---- Gráfico de barras (Total de ventas del mes y año) ----
  const ventasPorMes = Array(12).fill(0);
  const ventasPorAnio = {};

  datosParaCalculos.forEach(v => {
    if (!v.Fecha || !v.Total) return;
    const [, mes, anioStr] = v.Fecha.split("/");
    const mesIdx = parseInt(mes, 10) - 1;
    const anio = parseInt(anioStr, 10);

    if (!isNaN(mesIdx) && mesIdx >= 0 && mesIdx < 12) {
      ventasPorMes[mesIdx] += (v.Total || 0);
    }
    if (!isNaN(anio)) {
      ventasPorAnio[anio] = (ventasPorAnio[anio] || 0) + (v.Total || 0);
    }
  });

  const barData = {
    labels: meses,
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: ventasPorMes,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15, color: '#ffffff' } },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' }
      },
      x: { 
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  // ---- Gráfico de pastel (Productos más vendidos) ----
  const productosVendidosMap = {};
  datosParaCalculos.forEach(v => {
    if (!v.Producto || !v.Cantidad) return;
    productosVendidosMap[v.Producto] = (productosVendidosMap[v.Producto] || 0) + (v.Cantidad || 0);
  });

  const sortedProducts = Object.entries(productosVendidosMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 productos

  const topProductsPieData = {
    labels: sortedProducts.map(([product]) => product),
    datasets: [
      {
        data: sortedProducts.map(([, quantity]) => quantity),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 0,
      },
    ],
  };
  const topProductsPieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 15, padding: 15, color: '#ffffff' },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  // Opciones de meses para el filtro
  const monthOptions = [
    { value: '', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          {/* Título eliminado, más filtros agregados */}
          <div className="header-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', flex: 1 }}>
            <div className="search-container">
              <select
                value={categorySearchTerm}
                onChange={handleSearchTermChange}
                className="search-select"
              >
                <option value="">Todas las categorías</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <span className="search-icon">🔍</span>
            </div>
            <div className="filter-container">
              <select
                value={yearFilter}
                onChange={handleYearChange}
                className="search-select"
              >
                <option value="">Todos los años</option>
                {availableYears
                  .sort((a, b) => b - a)
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
            </div>
            <div className="filter-container">
              <select
                value={monthFilter}
                onChange={handleMonthChange}
                className="search-select"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-container">
              <select
                value={paymentFilter}
                onChange={handlePaymentChange}
                className="search-select"
              >
                <option value="">Todos los métodos de pago</option>
                {availablePayments.map(payment => (
                  <option key={payment} value={payment}>{payment}</option>
                ))}
              </select>
            </div>
            <div className="file-upload-container">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="file-input"
                id="file-input"
              />
              <label htmlFor="file-input" className="file-upload-label">
                Subir CSV
              </label>
            </div>
            <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="stats-charts-container">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>CANTIDAD TOTAL VENDIDA</h3>
                <p className="stat-value">{cantidadTotalVendida}</p>
              </div>
              <div className="stat-card">
                <h3>TOTAL COMPROBANTES</h3>
                <p className="stat-value">{totalComprobantes}</p>
              </div>
              <div className="stat-card">
                <h3>TOTAL VENTAS</h3>
                <p className="stat-value">S/{totalVentas.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <h3>GANANCIA NETA</h3>
                <p className="stat-value">S/{gananciaNeta.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <h3>MARGEN DE GANANCIA</h3>
                <p className="stat-value">{margenDeGanancia.toFixed(2)}%</p>
              </div>
            </div>
            <div className="charts-grid">
              <div className="chart-card">
                <h2>{doughnutChartTitle}</h2>
                <div className="chart-container">
                  {datosParaCalculos.length > 0 ? (
                    <Doughnut data={chartData} options={doughnutOptions} />
                  ) : (
                    <p>No hay datos para mostrar.</p>
                  )}
                </div>
              </div>
              <div className="chart-card">
                <h2>Ventas por Método de Pago ({categoryFilter ? `Filtro: ${categoryFilter}` : "Todas"})</h2>
                <div className="chart-container">
                  {datosParaCalculos.length > 0 ? (
                    <Line data={lineData} options={lineOptions} />
                  ) : (
                    <p>No hay datos para mostrar.</p>
                  )}
                </div>
              </div>
              <div className="chart-card">
                <h2>Ventas Mensuales ({categoryFilter ? `Filtro: ${categoryFilter}` : "Todas"})</h2>
                <div className="chart-container">
                  {datosParaCalculos.length > 0 ? (
                    <Bar data={barData} options={barOptions} />
                  ) : (
                    <p>No hay datos para mostrar.</p>
                  )}
                </div>
              </div>
              <div className="chart-card">
                <h2>Top 5 Productos Vendidos ({categoryFilter ? `Filtro: ${categoryFilter}` : "Todas"})</h2>
                <div className="chart-container">
                  {datosParaCalculos.length > 0 ? (
                    <Pie data={topProductsPieData} options={topProductsPieOptions} />
                  ) : (
                    <p>No hay datos para mostrar.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graficos;
