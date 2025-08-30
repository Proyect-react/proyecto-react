import React, { useState, useEffect } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import Papa from 'papaparse';
import Barra from '../Barra/Barra';
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
import './Graficos.css';

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

const Graficos = ({ onLogout }) => {
  const [ventas, setVentas] = useState([]);

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

  // ---- Stats ----
  const cantidadTotalVendida = ventas.reduce((acc, v) => acc + (v.Cantidad || 0), 0);
  const totalComprobantes = ventas.length;
  const totalVentasDia = ventas.reduce((acc, v) => acc + (v.Total || 0), 0);
  const gananciaNetaDia = ventas.reduce((acc, v) => acc + ((v.Total || 0) - (v.Costo || 0)), 0);
  const margenGanancia = totalVentasDia > 0 ? (gananciaNetaDia / totalVentasDia) * 100 : 0;

  const statsData = [
    { title: 'Cantidad Total Vendida', value: cantidadTotalVendida },
    { title: 'Total Comprobantes', value: totalComprobantes },
    { title: 'Total Ventas', value: `S/${totalVentasDia.toFixed(2)}` },
    { title: 'Ganancia Neta', value: `S/${gananciaNetaDia.toFixed(2)}` },
    { title: 'Margen de Ganancia', value: `${margenGanancia.toFixed(2)}%` },
  ];

  // ---- Doughnut ----
  const categoriaMap = {};
  ventas.forEach((v) => {
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

  // ---- Line ----
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const pagoData = {};
  ventas.forEach((v) => {
    if (!v.Fecha || !v.Total) return;
    const [dia, mes] = v.Fecha.split('/');
    const mesIdx = parseInt(mes, 10) - 1;
    const metodo = v.Pago || 'Otro';
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

  return (
    <div className="graficos">
      {/* Header similar al Dashboard */}
      <header className="dashboard-header">
        <h1>Panel de Gráficos</h1>
        <div className="header-right">
        </div>
      </header>

      <Barra onLogout={onLogout} />

        {/* Contenido principal */}
        <div style={{ flex: 1 }}>
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
                <Doughnut data={chartData} />
              </div>
            </div>

            <div className="chart-card">
              <h2>Ventas por Método de Pago</h2>
              <div className="chart-container">
                <Line data={lineData} />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Graficos;
