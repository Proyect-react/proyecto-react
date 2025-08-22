import React, { useState, useEffect } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import Papa from 'papaparse';
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
} from 'chart.js';
import './Dashboard.css';

// Registramos los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ventas, setVentas] = useState([]);

  // Cargar CSV al montar el componente
  useEffect(() => {
    Papa.parse('/ventas.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setVentas(result.data);
      },
    });
  }, []);

  // ---- Filtro dinámico ----
  const hoy = new Date();
  const hoyStr = hoy.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  let datosFiltrados = [];

  if (searchTerm.trim() !== "") {
    datosFiltrados = ventas.filter(v =>
      (v.Producto || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  } else {
    datosFiltrados = ventas;
  }

  // ---- Stats según filtro ----
  const cantidadTotalVendida = datosFiltrados.reduce((acc, v) => acc + (v.Cantidad || 0), 0);
  const totalComprobantes = datosFiltrados.length;
  const totalVentasDia = datosFiltrados.reduce((acc, v) => acc + (v.Total || 0), 0);
  const gananciaNetaDia = datosFiltrados.reduce((acc, v) => acc + ((v.Total || 0) - (v.Costo || 0)), 0);
  const margenGanancia = totalVentasDia > 0 ? (gananciaNetaDia / totalVentasDia) * 100 : 0;

  const statsData = [
    { title: "Cantidad Total Vendida", value: cantidadTotalVendida },
    { title: "Total Comprobantes", value: totalComprobantes },
    { title: "Total Ventas", value: `S/${totalVentasDia.toFixed(2)}` },
    { title: "Ganancia Neta", value: `S/${gananciaNetaDia.toFixed(2)}` },
    { title: "Margen de Ganancia", value: `${margenGanancia.toFixed(2)}%` },
  ];
  // ---- Gráfico de pastel (ventas por categoría según filtro) ----
  const categoriaMap = {};
  datosFiltrados.forEach(v => {
    if (!v.Categoría) return;
    categoriaMap[v.Categoría] = (categoriaMap[v.Categoría] || 0) + v.Total;
  });
  const chartData = {
    labels: Object.keys(categoriaMap),
    datasets: [
      {
        data: Object.values(categoriaMap),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 0,
      },
    ],
  };
  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 15, padding: 15 },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  // ---- Gráfico de líneas (ventas por mes según filtro) ----
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const pagoData = {};
  datosFiltrados.forEach(v => {
    if (!v.Fecha || !v.Total) return;
    const [dia, mes, anio] = v.Fecha.split("/");
    const mesIdx = parseInt(mes, 10) - 1;
    const metodo = v.Pago || "Otro";
    if (!pagoData[metodo]) pagoData[metodo] = Array(12).fill(0);
    pagoData[metodo][mesIdx] += v.Total;
  });
  const lineData = {
    labels: meses,
    datasets: Object.keys(pagoData).map((metodo, idx) => ({
      label: metodo,
      data: pagoData[metodo],
      fill: false,
      borderColor: ['#36A2EB', '#FF6384', '#4BC0C0', '#9966FF'][idx % 4],
      tension: 0.1,
    })),
  };
  const lineOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15 } },
    },
    scales: {
      y: { beginAtZero: true },
    },
    maintainAspectRatio: false,
  };
  // ---- Transacciones (muestran lo filtrado) ----
  const TransactionItem = ({ transaction }) => (
    <div className="transaction-item">
      <div className="transaction-desc">{transaction.Producto}</div>
      <div className="transaction-amount">S/{transaction.Total}</div>
      <div className="transaction-condition">{transaction.Pago}</div>
    </div>
  );
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        {/* Título centrado */}
        <h1 style={{ flex: 1, textAlign: "center" }}>Registro de Ventas</h1>

        <div className="header-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </header>
      <div className="dashboard-content">
        <div className="stats-grid">
          {statsData.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h2>Ventas por Categoría</h2>
            <div className="chart-container">
              <Doughnut data={chartData} options={doughnutOptions} />
            </div>
          </div>

          <div className="chart-card">
            <h2>Ventas por Método de Pago</h2>
            <div className="chart-container">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        <div className="transactions-card">
          <div className="transactions-header">
            <h2>
              Listado (
              {searchTerm ? `Filtro: ${searchTerm}` : "Todas las ventas"}
              )
            </h2>
            <div className="transactions-count">
              {datosFiltrados.length} transacciones
            </div>
          </div>
          <div className="transactions-list">
            {datosFiltrados.map((transaction, idx) => (
              <TransactionItem key={idx} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;