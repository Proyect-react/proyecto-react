import React, { useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
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

  // Datos de ejemplo
  const statsData = [
    { title: "Cantidad Total Vendida", value: "15" },
    { title: "Total Comprobantes", value: "S/1498.70" },
    { title: "Total Ventas del Día", value: "S/1291.70" },
    { title: "Ganancia Total del Día", value: "S/291.70" },
    { title: "Margen de Ganancia", value: "58.49%" }
  ];

  // Datos para el gráfico de pastel (Ganancias por Categoría)
  const chartData = {
    labels: ["Categoría A", "Categoría B", "Categoría C", "Categoría D"],
    datasets: [
      {
        data: [120, 90, 60, 30],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  // Datos para el gráfico de líneas (Ventas por Condición de Pago)
  const lineData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Contado (PA)',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        tension: 0.1,
      },
      {
        label: 'Crédito (PA)',
        data: [35, 40, 30, 35, 25, 30],
        fill: false,
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  const transactionsData = [
    { id: 1, description: "Venta 1", amount: "150.00", condition: "Contado" },
    { id: 2, description: "Venta 2", amount: "200.50", condition: "Crédito" },
    { id: 3, description: "Venta 3", amount: "75.30", condition: "Contado" }
  ];

  // Filtrar transacciones basado en la búsqueda
  const filteredTransactions = transactionsData.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.amount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Componente para ítems de transacción
  const TransactionItem = ({ transaction }) => (
    <div className="transaction-item">
      <div className="transaction-desc">{transaction.description}</div>
      <div className="transaction-amount">{transaction.amount}</div>
      <div className="transaction-condition">{transaction.condition}</div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-center">
          <h1>Registro de Ventas</h1>
        </div>
        <div className="header-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar transacciones..."
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
              {stat.subtitle && <div className="stat-subtitle">{stat.subtitle}</div>}
            </div>
          ))}
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <h2>Ganancias por Categoría</h2>
            <div className="chart-container">
              <Doughnut data={chartData} options={doughnutOptions} />
            </div>
          </div>
          
          <div className="chart-card">
            <h2>Ventas por Condición de Pago</h2>
            <div className="chart-container">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>
        
        <div className="transactions-card">
          <div className="transactions-header">
            <h2>Listado de Transacciones del Día ({new Date().toLocaleDateString()})</h2>
            <div className="transactions-count">
              {filteredTransactions.length} transacciones
            </div>
          </div>
          <div className="transactions-list">
            {filteredTransactions.map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;