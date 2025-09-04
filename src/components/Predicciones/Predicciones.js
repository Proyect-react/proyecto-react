import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../AuthWrapper/AuthWrapper';
import './Predicciones.css';

const Predicciones = ({ onLogout }) => {
  const [ventas, setVentas] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [futureDate, setFutureDate] = useState('');
  const [predictedProfit, setPredictedProfit] = useState(null);
  const [categoryProfits, setCategoryProfits] = useState({}); // Para guardar la predicción de cada categoría

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

  // Función para manejar el cambio en la selección de categoría
  const handleSearchTermChange = (e) => {
    const selectedCategory = e.target.value;
    setCategorySearchTerm(selectedCategory);
    setCategoryFilter(selectedCategory);
  };

  // Nueva función para calcular la predicción de una categoría específica
  const calcularPrediccionCategoria = (categoria) => {
    const filteredSales = ventas.filter(v =>
      (v.Categoría || "").toLowerCase() === categoria.toLowerCase()
    );
    if (filteredSales.length === 0) {
      return null;
    }
    const totalGananciaFiltrada = filteredSales.reduce((acc, v) => acc + ((v.Total || 0) - (v.Costo || 0)), 0);
    const uniqueDates = [...new Set(filteredSales.map(v => v.Fecha))].length;
    const dailyAverageProfit = uniqueDates > 0 ? totalGananciaFiltrada / uniqueDates : 0;
    const today = new Date();
    const future = new Date(futureDate);
    const diffTime = Math.abs(future.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const projectedProfit = dailyAverageProfit * diffDays;
    return projectedProfit;
  };

  // Predicción para la categoría seleccionada o todas las categorías
  const calculatePrediction = useCallback(() => {
    if (!futureDate) {
      setPredictedProfit(null);
      setCategoryProfits({});
      return;
    }

    // Si no hay filtro (todas las categorías)
    if (categoryFilter.trim() === "") {
      if (ventas.length === 0) {
        setPredictedProfit("No hay datos de ventas.");
        setCategoryProfits({});
        return;
      }
      // Calcular la predicción para cada categoría y sumarlas
      let suma = 0;
      let profitsPorCategoria = {};
      availableCategories.forEach(cat => {
        const pred = calcularPrediccionCategoria(cat);
        profitsPorCategoria[cat] = pred !== null ? pred : 0;
        suma += pred !== null ? pred : 0;
      });
      setCategoryProfits(profitsPorCategoria);
      setPredictedProfit(suma === 0 ? "No hay datos de ventas." : suma.toFixed(2));
      return;
    }

    // Si hay filtro de categoría
    const filteredSales = ventas.filter(v =>
      (v.Categoría || "").toLowerCase().includes(categoryFilter.toLowerCase())
    );

    if (filteredSales.length === 0) {
      setPredictedProfit("No hay datos de ventas para esta categoría.");
      return;
    }

    // Calcular la ganancia diaria promedio para la categoría filtrada
    const totalGananciaFiltrada = filteredSales.reduce((acc, v) => acc + ((v.Total || 0) - (v.Costo || 0)), 0);
    const uniqueDates = [...new Set(filteredSales.map(v => v.Fecha))].length;
    const dailyAverageProfit = uniqueDates > 0 ? totalGananciaFiltrada / uniqueDates : 0;

    // Calcular la diferencia en días desde hoy hasta la fecha futura
    const today = new Date();
    const future = new Date(futureDate);
    const diffTime = Math.abs(future.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Proyectar la ganancia futura
    const projectedProfit = dailyAverageProfit * diffDays;
    setPredictedProfit(projectedProfit.toFixed(2));
  }, [futureDate, categoryFilter, ventas, availableCategories]);

  useEffect(() => {
    calculatePrediction();
  }, [futureDate, categoryFilter, ventas, availableCategories, calculatePrediction]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1 style={{ flex: 1, textAlign: "center" }}>Predicciones</h1>

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
          <div className="predictions-container">
            <h2>Predicciones de Ganancias</h2>
            <div className="prediction-input-group">
              <label htmlFor="futureDate">Selecciona una fecha futura:</label>
              <input
                type="date"
                id="futureDate"
                value={futureDate}
                onChange={(e) => setFutureDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="prediction-result-card">
              <h3>Ganancia Pronosticada para {futureDate || 'la fecha seleccionada'}:</h3>
              {/* Mostrar la predicción de todas las categorías como la suma de las predicciones individuales */}
              {categoryFilter.trim() === "" ? (
                <>
                  <p>
                    <strong>Todas las categorías:</strong>{" "}
                    {predictedProfit !== null && predictedProfit !== "No hay datos de ventas."
                      ? `S/${predictedProfit}`
                      : predictedProfit}
                  </p>
                  {/* Mostrar el desglose por categoría */}
                  {Object.keys(categoryProfits).length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Desglose por categoría:</strong>
                      <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                        {availableCategories.map(cat => (
                          <li key={cat}>
                            {cat}: {categoryProfits[cat] !== null && categoryProfits[cat] !== undefined
                              ? `S/${categoryProfits[cat].toFixed(2)}`
                              : "Sin datos"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>
                  <strong>Para la categoría "{categoryFilter}":</strong>{" "}
                  {predictedProfit !== null && predictedProfit !== "No hay datos de ventas para esta categoría."
                    ? `S/${predictedProfit}`
                    : predictedProfit}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predicciones;