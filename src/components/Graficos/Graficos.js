/**
 * Graficos.js - Componente de visualización de datos y estadísticas
 * 
 * Este componente maneja:
 * - Carga y procesamiento de archivos CSV
 * - Filtrado de datos por categoría, año, mes y método de pago
 * - Cálculo de estadísticas (ventas, ganancias, márgenes)
 * - Visualización de datos mediante gráficos interactivos
 * - Tabla de productos recientes
 */

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

// Registrar componentes de Chart.js necesarios para los gráficos
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

/**
 * Componente Graficos - Visualización de datos de ventas
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onLogout - Función para cerrar sesión
 */
const Graficos = ({ onLogout }) => {
  // Estados para datos de ventas y opciones de filtros
  const [ventas, setVentas] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availablePayments, setAvailablePayments] = useState([]);

  // Estados para filtros activos
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Obtener filtros del contexto de autenticación
  const { categoryFilter, setCategoryFilter, categorySearchTerm, setCategorySearchTerm } = useAuth();

  /**
   * Función auxiliar para procesar datos CSV y extraer opciones de filtros
   * @param {Array} data - Datos del CSV parseado
   */
  const processCSVData = (data) => {
    // Extraer categorías únicas
    const uniqueCategories = [...new Set(data.map(v => v.Categoría).filter(Boolean))];
    setAvailableCategories(uniqueCategories);

    // Extraer años únicos de las fechas
    const uniqueYears = [
      ...new Set(
        data
          .map(v => {
            if (!v.Fecha) return null;
            const parts = v.Fecha.split('/');
            return parts.length === 3 ? parts[2] : null;
          })
          .filter(Boolean)
      ),
    ];
    setAvailableYears(uniqueYears);

    // Extraer meses únicos de las fechas
    const uniqueMonths = [
      ...new Set(
        data
          .map(v => {
            if (!v.Fecha) return null;
            const parts = v.Fecha.split('/');
            return parts.length === 3 ? parts[1] : null;
          })
          .filter(Boolean)
      ),
    ];
    setAvailableMonths(uniqueMonths);

    // Extraer métodos de pago únicos
    const uniquePayments = [
      ...new Set(data.map(v => v.Pago).filter(Boolean)),
    ];
    setAvailablePayments(uniquePayments);
  };

  /**
   * Efecto para cargar el archivo CSV por defecto al montar el componente
   */
  useEffect(() => {
    Papa.parse('/ventas.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: ';',
      complete: (result) => {
        setVentas(result.data);
        processCSVData(result.data);
      },
    });
  }, []);

  /**
   * Función para manejar la carga de un nuevo archivo CSV
   * @param {Event} event - Evento del input de archivo
   */
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
          // Resetear todos los filtros al cargar nuevo archivo
          setCategoryFilter('');
          setCategorySearchTerm('');
          setYearFilter('');
          setMonthFilter('');
          setPaymentFilter('');
          processCSVData(result.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error al procesar el archivo CSV. Asegúrate de que el formato sea correcto.');
        },
      });
    }
  };

  /**
   * Datos filtrados para los gráficos y estadísticas
   * Aplica todos los filtros activos (categoría, año, mes, método de pago)
   */
  const datosParaCalculos = ventas.filter(v => {
    let match = true;
    
    // Filtro por categoría
    if (categoryFilter.trim() !== "") {
      match = match && (v.Categoría || "").toLowerCase().includes(categoryFilter.toLowerCase());
    }
    
    // Filtro por año
    if (yearFilter.trim() !== "") {
      if (!v.Fecha) return false;
      const parts = v.Fecha.split('/');
      match = match && parts.length === 3 && parts[2] === yearFilter;
    }
    
    // Filtro por mes
    if (monthFilter.trim() !== "") {
      if (!v.Fecha) return false;
      const parts = v.Fecha.split('/');
      match = match && parts.length === 3 && parts[1] === monthFilter;
    }
    
    // Filtro por método de pago
    if (paymentFilter.trim() !== "") {
      match = match && (v.Pago || "") === paymentFilter;
    }
    
    return match;
  });

  // Funciones para manejar cambios en los filtros
  const handleSearchTermChange = (e) => {
    const selectedCategory = e.target.value;
    setCategorySearchTerm(selectedCategory);
    setCategoryFilter(selectedCategory);
  };

  const handleYearChange = (e) => {
    setYearFilter(e.target.value);
  };

  const handleMonthChange = (e) => {
    setMonthFilter(e.target.value);
  };

  const handlePaymentChange = (e) => {
    setPaymentFilter(e.target.value);
  };

  // ---- Cálculos de estadísticas principales ----
  const cantidadTotalVendida = datosParaCalculos.reduce((acc, v) => acc + (v.Cantidad || 0), 0);
  const totalComprobantes = datosParaCalculos.length;
  const totalVentas = datosParaCalculos.reduce((acc, v) => acc + (v.Total || 0), 0);
  const gananciaNeta = datosParaCalculos.reduce((acc, v) => acc + ((v.Total || 0) - (v.Costo || 0)), 0);
  const margenDeGanancia = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0;

  // ---- Configuración del gráfico de dona (ventas por categoría/producto) ----
  let chartLabels;
  let chartValues;
  let doughnutChartTitle;

  if (categoryFilter.trim() !== "") {
    // Si hay filtro de categoría, mostrar ventas por producto dentro de esa categoría
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
        backgroundColor: ['#e78da0ff', '#486ec0ff', '#ead398ff', '#10c07fff', '#8676a7ff', '#7e6d54ff', '#00d8a2ff', '#e23434ff'],
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

  // ---- Configuración del gráfico de líneas (ventas por método de pago) ----
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
      backgroundColor: ['#6194a0ff', '#e49898ff', '#fee8a1ff', '#6a9b7cff', '#b5a6e1ff', '#e8d6dfff', '#4eafd8b1', '#886750ff'],
      tension: 0.1,
    })),
  };

  const lineOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15, color: '#ffffffff' } },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(20, 19, 19, 0.4)' }
      },
      x: { 
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  // ---- Configuración del gráfico de barras (ventas mensuales) ----
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
        backgroundColor: 'rgba(38, 123, 123, 0.6)',
        borderColor: 'rgba(107, 231, 231, 1)',
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

  // ---- Configuración del gráfico de pastel (productos más vendidos) ----
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
        backgroundColor: ['#f79e9ec3', '#64a9d6c5', '#e8cb809f', '#2620d4ff', '#413b4dff'],
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

  // ---- Procesamiento de últimos productos comprados ----
  /**
   * Función para parsear fechas en formato DD/MM/YYYY
   * @param {string} fechaStr - Fecha en formato string
   * @returns {Date|null} Objeto Date o null si la fecha es inválida
   */
  function parseFecha(fechaStr) {
    if (!fechaStr) return null;
    const [dd, mm, yyyy] = fechaStr.split('/');
    if (!dd || !mm || !yyyy) return null;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  // Filtrar y ordenar ventas por fecha para mostrar los últimos 5 productos
  const ventasConProductoYFecha = datosParaCalculos
    .filter(v => v.Producto && v.Fecha)
    .map((v, idx) => ({
      ...v,
      _parsedFecha: parseFecha(v.Fecha),
      _originalIdx: idx,
    }))
    .filter(v => v._parsedFecha instanceof Date && !isNaN(v._parsedFecha));

  // Ordenar por fecha descendente (más reciente primero)
  ventasConProductoYFecha.sort((a, b) => {
    if (b._parsedFecha - a._parsedFecha !== 0) {
      return b._parsedFecha - a._parsedFecha;
    }
    return a._originalIdx - b._originalIdx;
  });

  const ultimos5Productos = ventasConProductoYFecha.slice(0, 5);

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
        {/* Encabezado con filtros y controles */}
        <header className="dashboard-header graficos-header">
          {/* Filtro por categoría */}
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

          {/* Filtro por año */}
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

          {/* Filtro por mes */}
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

          {/* Filtro por método de pago */}
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

          {/* Cargador de archivos CSV */}
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

          {/* Botón de cerrar sesión */}
          <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
        </header>

        {/* Contenido principal con estadísticas y gráficos */}
        <div className="dashboard-content graficos-content">
          <div className="stats-charts-container">
            {/* Grid de tarjetas de estadísticas */}
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

            {/* Grid de gráficos principales */}
            <div className="charts-grid">
              {/* Gráfico de dona - Ventas por categoría/producto */}
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

              {/* Gráfico de líneas - Ventas por método de pago */}
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

              {/* Gráfico de barras - Ventas mensuales */}
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

              {/* Gráfico de pastel - Top 5 productos vendidos */}
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

          {/* Tabla de los últimos 5 productos comprados */}
          <div className="ultimos-productos-table-container">
            <h2 className="ultimos-productos-title">Últimos 5 productos comprados</h2>
            <div className="ultimos-productos-table-scroll">
              <table className="ultimos-productos-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Categoría</th>
                    <th>Total</th>
                    <th>Método de Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimos5Productos.length > 0 ? (
                    ultimos5Productos.map((v, idx) => (
                      <tr key={idx}>
                        <td>{v.Fecha}</td>
                        <td>{v.Producto}</td>
                        <td>{v.Cantidad}</td>
                        <td>{v.Categoría}</td>
                        <td>{v.Total?.toFixed ? `S/${v.Total.toFixed(2)}` : v.Total}</td>
                        <td>{v.Pago}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                        No hay productos recientes para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graficos;