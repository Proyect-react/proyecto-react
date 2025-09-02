import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../AuthWrapper/AuthWrapper';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [ventas, setVentas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableCategories, setAvailableCategories] = useState([]);
  const itemsPerPage = 10;

  const { categoryFilter, setCategoryFilter, categorySearchTerm, setCategorySearchTerm } = useAuth();

  // Hook para cargar el CSV al montar el componente y extraer categorías
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
          const uniqueCategories = [...new Set(result.data.map(v => v.Categoría).filter(Boolean))];
          setAvailableCategories(uniqueCategories);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error al procesar el archivo CSV. Asegúrate de que el formato sea correcto.');
        },
      });
    }
  };

  // Filtro dinámico para la tabla de productos y ordenamiento por fecha de mayor a menor
  let datosFiltradosProductos = [];
  if (categoryFilter.trim() === "") {
    // Si no hay filtro, mostrar todos los productos
    datosFiltradosProductos = ventas
      .slice()
      .sort((a, b) => {
        // Ordenar por fecha de mayor a menor
        const fechaA = a.Fecha ? new Date(a.Fecha) : new Date(0);
        const fechaB = b.Fecha ? new Date(b.Fecha) : new Date(0);
        if (isNaN(fechaA.getTime())) return 1;
        if (isNaN(fechaB.getTime())) return -1;
        return fechaB - fechaA;
      });
  } else {
    datosFiltradosProductos = ventas
      .filter(v =>
        (v.Categoría || "").toLowerCase().includes(categoryFilter.toLowerCase())
      )
      .sort((a, b) => {
        // Ordenar por fecha de mayor a menor
        const fechaA = a.Fecha ? new Date(a.Fecha) : new Date(0);
        const fechaB = b.Fecha ? new Date(b.Fecha) : new Date(0);
        if (isNaN(fechaA.getTime())) return 1;
        if (isNaN(fechaB.getTime())) return -1;
        return fechaB - fechaA;
      });
  }

  // Función para manejar el cambio en la selección de categoría
  const handleSearchTermChange = (e) => {
    const selectedCategory = e.target.value;
    setCategorySearchTerm(selectedCategory);
    setCategoryFilter(selectedCategory);
    setCurrentPage(1);
  };

  // Componente funcional para renderizar un item de transacción/producto en la lista
  // El precio mostrado será el precio unitario
  const TransactionItem = ({ transaction }) => (
    <div className="transaction-item">
      <div className="transaction-details">
        <span className="transaction-product">{transaction.Producto || 'N/A'}</span>
        <span className="transaction-category">{transaction.Categoría || 'N/A'}</span>
        <span className="transaction-date">{transaction.Fecha || 'N/A'}</span>
        <span className="transaction-amount">
          S/
          {(
            transaction.PrecioUnitario !== undefined && transaction.PrecioUnitario !== null
              ? Number(transaction.PrecioUnitario)
              : (transaction.Precio !== undefined && transaction.Precio !== null
                  ? Number(transaction.Precio)
                  : 0)
          ).toFixed(2)}
        </span>
        <span className="transaction-condition">{transaction.Pago || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1 style={{ flex: 1, textAlign: "center" }}>Productos</h1>

          <div className="header-right">
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
          <div className="transactions-card">
            <div className="transactions-header">
              <h2>
                {categoryFilter
                  ? `Productos en ${categoryFilter}`
                  : "Lista de Productos (Todas las categorías)"}
              </h2>
              <span className="transactions-count">
                {datosFiltradosProductos.length > 0
                  ? `Mostrando ${Math.min(currentPage * itemsPerPage, datosFiltradosProductos.length)}-${Math.min(currentPage * itemsPerPage + itemsPerPage - 1, datosFiltradosProductos.length)} de ${datosFiltradosProductos.length} productos`
                  : "No hay datos para mostrar"}
              </span>
            </div>
            <div className="transactions-list">
              <div className="transaction-item header">
                <div className="transaction-details">
                  <span className="transaction-product">PRODUCTO</span>
                  <span className="transaction-category">CATEGORÍA</span>
                  <span className="transaction-date">FECHA</span>
                  <span className="transaction-amount">PRECIO</span>
                  <span className="transaction-condition">MÉTODO DE PAGO</span>
                </div>
              </div>
              {datosFiltradosProductos.length > 0 ? (
                datosFiltradosProductos
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((transaction, idx) => (
                    <TransactionItem key={idx} transaction={transaction} />
                  ))
              ) : (
                <div className="transaction-item">
                  <div className="transaction-details" style={{ justifyContent: 'center', width: '100%' }}>
                    <span>No hay productos para mostrar en esta categoría o no se ha seleccionado ninguna.</span>
                  </div>
                </div>
              )}
            </div>
            <div className="pagination">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</button>
              <span>Página {currentPage} de {Math.ceil(datosFiltradosProductos.length / itemsPerPage)}</span>
              <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage * itemsPerPage >= datosFiltradosProductos.length}>Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;