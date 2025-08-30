import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './Dashboard.css';
import Barra from '../Barra/Barra';


const Dashboard = ({ onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ventas, setVentas] = useState([]);

  // Hook para navegación
  const navegarAGraficos = () => {
    window.location.href = '/graficos';
  };

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
  let datosFiltrados = [];
  if (searchTerm.trim() !== '') {
    datosFiltrados = ventas.filter((v) =>
      (v.Producto || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  } else {
    datosFiltrados = ventas;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Registro de Ventas</h1>

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
        </div>
      </header>
        {/* Barra lateral de navegación */}
        <Barra onLogout={onLogout} irAGraficos={navegarAGraficos} />

        {/* Tabla */}
        <div className="transactions-card">
          <div className="transactions-header">
            <h2>
              Listado ({searchTerm ? `Filtro: ${searchTerm}` : 'Todas las ventas'})
            </h2>
            <div className="transactions-count">
              Mostrando {Math.min(12, datosFiltrados.length)} de {datosFiltrados.length} transacciones
            </div>
          </div>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Método de Pago</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.slice(0, 12).map((transaction, idx) => (
                <tr key={idx}>
                  <td>{transaction.Categoría}</td>
                  <td>{transaction.Producto}</td>
                  <td>S/{transaction.Total}</td>
                  <td>{transaction.Pago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default Dashboard;
