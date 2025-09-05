import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../AuthWrapper/AuthWrapper';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Predicciones.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Predicciones = ({ onLogout }) => {
  const [ventas, setVentas] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [predictionYear, setPredictionYear] = useState(new Date().getFullYear()); // Default to current year
  const [predictedProfit, setPredictedProfit] = useState(null);
  const [predictedTotal, setPredictedTotal] = useState(null);
  const [predictedMargin, setPredictedMargin] = useState(null);
  const [predictedIncrement, setPredictedIncrement] = useState(null);
  const [globalProfitSlope, setGlobalProfitSlope] = useState(null);
  const [globalProfitIntercept, setGlobalProfitIntercept] = useState(null);
  const [globalTotalSlope, setGlobalTotalSlope] = useState(null);
  const [globalTotalIntercept, setGlobalTotalIntercept] = useState(null);
  const [avgMonthlyProfitChange, setAvgMonthlyProfitChange] = useState(null);
  const [avgMonthlyTotalChange, setAvgMonthlyTotalChange] = useState(null);
  const [categoryProfits, setCategoryProfits] = useState({}); // Para guardar la predicción de cada categoría
  const [showPredictionResults, setShowPredictionResults] = useState(false); // Reintroducimos este estado
  const [chartLabels, setChartLabels] = useState([]);
  const [chartProfitData, setChartProfitData] = useState([]);
  const [chartTotalData, setChartTotalData] = useState([]);

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

  // Función de regresión lineal simple
  const linearRegression = (data) => {
    if (data.length < 2) return { slope: null, intercept: null }; // Devolver null si no hay suficientes datos

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let n = data.length;

    for (let i = 0; i < n; i++) {
      sumX += data[i].x;
      sumY += data[i].y;
      sumXY += data[i].x * data[i].y;
      sumXX += data[i].x * data[i].x;
    }

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return { slope: null, intercept: null }; // Evitar división por cero

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  // Nueva función para calcular la predicción de una categoría específica
  const calcularPrediccionCategoria = useCallback((categoria) => {
    const filteredSales = ventas.filter(v =>
      (v.Categoría || "").toLowerCase() === categoria.toLowerCase()
    );
    if (filteredSales.length === 0) {
      return { profit: null, total: null, increment: null, margin: null };
    }

    // Preparar datos para regresión lineal de Ganancia y Total
    const salesByDate = {};
    filteredSales.forEach(sale => {
      const dateParts = (sale.Fecha || "").split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Meses son 0-indexados en JavaScript
        const year = parseInt(dateParts[2], 10);
        const saleDate = new Date(year, month, day); // Crear fecha con YYYY, MM, DD
        const monthYearKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
        const monthStartTimestamp = new Date(year, month, 1).getTime(); // Timestamp for the start of the month

        if (!isNaN(monthStartTimestamp)) {
          if (!salesByDate[monthYearKey]) {
            salesByDate[monthYearKey] = { profit: 0, total: 0, timestamp: monthStartTimestamp };
          }
          salesByDate[monthYearKey].profit += (sale.Total || 0) - (sale.Costo || 0);
          salesByDate[monthYearKey].total += (sale.Total || 0);
        }
      }
    });

    const profitDataForRegression = Object.values(salesByDate).map(data => ({
      x: data.timestamp,
      y: data.profit
    })).sort((a, b) => a.x - b.x);

    const totalDataForRegression = Object.values(salesByDate).map(data => ({
      x: data.timestamp,
      y: data.total
    })).sort((a, b) => a.x - b.x);

    // const twelveMonthsAgo = new Date(new Date(predictionYear).setFullYear(new Date(predictionYear).getFullYear() - 1));
    // const twelveMonthsAgoTimestamp = twelveMonthsAgo.getTime();

    // const recentProfitDataForRegression = profitDataForRegression.filter(item => item.x >= twelveMonthsAgoTimestamp);
    // const recentTotalDataForRegression = totalDataForRegression.filter(item => item.x >= twelveMonthsAgoTimestamp);

    const { slope: profitSlope, intercept: profitIntercept } = linearRegression(profitDataForRegression);
    const { slope: totalSlope, intercept: totalIntercept } = linearRegression(totalDataForRegression);

    // Si la regresión no es posible, devolvemos nulls
    if (profitSlope === null || totalSlope === null || !predictionYear) {
      return { profit: null, total: null, increment: null, margin: null };
    }

    const futureTimestamp = new Date(predictionYear, 11, 31).getTime(); // Prediction for December 31st of the selected year
    let projectedProfit = profitSlope * futureTimestamp + profitIntercept;
    let projectedTotal = totalSlope * futureTimestamp + totalIntercept;

    // Asegurarse de que las predicciones no sean negativas
    projectedProfit = Math.max(0, projectedProfit);
    projectedTotal = Math.max(0, projectedTotal);

    const currentProfit = profitDataForRegression.length > 0 ? profitDataForRegression[profitDataForRegression.length - 1].y : null;
    const currentTotal = totalDataForRegression.length > 0 ? totalDataForRegression[totalDataForRegression.length - 1].y : null;

    // Calcular incremento y margen solo si hay datos actuales válidos
    const increment = (currentProfit !== null && currentProfit > 0) ? ((projectedProfit - currentProfit) / currentProfit) * 100 : null;
    const margin = (projectedTotal !== null && projectedTotal > 0) ? (projectedProfit / projectedTotal) * 100 : null;
    
    return { profit: projectedProfit, total: projectedTotal, increment, margin, profitDataForRegression, totalDataForRegression, profitSlope, profitIntercept, totalSlope, totalIntercept };
  }, [ventas, predictionYear]);

  // Predicción para la categoría seleccionada o todas las categorías
  const calculatePrediction = useCallback(() => {
    if (!predictionYear) {
      setPredictedProfit(null);
      setPredictedTotal(null);
      setPredictedMargin(null);
      setPredictedIncrement(null);
      setCategoryProfits({});
      setShowPredictionResults(false); // Ocultar resultados si no hay fecha seleccionada
      return;
    }

    if (ventas.length === 0) {
      setPredictedProfit(null);
      setPredictedTotal(null);
      setPredictedMargin(null);
      setPredictedIncrement(null);
      setCategoryProfits({});
      setShowPredictionResults(false); // Ocultar resultados si no hay datos de ventas
      return;
    }

    let totalPredictedProfit = 0;
    let totalPredictedSales = 0;
    let hasValidCategoryPredictions = false;
    let profitsPorCategoria = {};
    let totalsPorCategoria = {};
    let incrementsPorCategoria = {};
    let marginsPorCategoria = {};

    const targetCategories = categoryFilter.trim() === "" ? availableCategories : [categoryFilter];

    targetCategories.forEach(cat => {
      const { profit, total, increment, margin } = calcularPrediccionCategoria(cat);
      
      if (profit !== null && total !== null) {
        profitsPorCategoria[cat] = profit;
        totalsPorCategoria[cat] = total;
        incrementsPorCategoria[cat] = increment;
        marginsPorCategoria[cat] = margin;

        totalPredictedProfit += profit;
        totalPredictedSales += total;
        hasValidCategoryPredictions = true;
      } else {
        profitsPorCategoria[cat] = null;
        totalsPorCategoria[cat] = null;
        incrementsPorCategoria[cat] = null;
        marginsPorCategoria[cat] = null;
      }
    });

    setCategoryProfits(profitsPorCategoria);

    // Aggregate all historical data for overall regression
    let allHistoricalProfitData = [];
    let allHistoricalTotalData = [];

    const filteredVentasForGlobalRegression = ventas.filter(sale => 
      categoryFilter.trim() === "" || (sale.Categoría || "").toLowerCase() === categoryFilter.toLowerCase()
    );

    const allSalesByDate = {};
    filteredVentasForGlobalRegression.forEach(sale => {
      const dateParts = (sale.Fecha || "").split('/');
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        const monthYearKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
        const monthStartTimestamp = new Date(year, month, 1).getTime();

        if (!isNaN(monthStartTimestamp)) {
          if (!allSalesByDate[monthYearKey]) {
            allSalesByDate[monthYearKey] = { profit: 0, total: 0, timestamp: monthStartTimestamp };
          }
          allSalesByDate[monthYearKey].profit += (sale.Total || 0) - (sale.Costo || 0);
          allSalesByDate[monthYearKey].total += (sale.Total || 0);
        }
      }
    });

    allHistoricalProfitData = Object.values(allSalesByDate).map(data => ({
      x: data.timestamp,
      y: data.profit
    })).sort((a, b) => a.x - b.x);

    allHistoricalTotalData = Object.values(allSalesByDate).map(data => ({
      x: data.timestamp,
      y: data.total
    })).sort((a, b) => a.x - b.x);

    const { slope: overallProfitSlope, intercept: overallProfitIntercept } = linearRegression(allHistoricalProfitData);
    const { slope: overallTotalSlope, intercept: overallTotalIntercept } = linearRegression(allHistoricalTotalData);

    setGlobalProfitSlope(overallProfitSlope);
    setGlobalProfitIntercept(overallProfitIntercept);
    setGlobalTotalSlope(overallTotalSlope);
    setGlobalTotalIntercept(overallTotalIntercept);

    // Calculate average monthly change for profit and total sales
    let sumProfitChanges = 0;
    let sumTotalChanges = 0;
    let changeCount = 0;

    for (let i = 1; i < allHistoricalProfitData.length; i++) {
      sumProfitChanges += Math.abs(allHistoricalProfitData[i].y - allHistoricalProfitData[i - 1].y);
      sumTotalChanges += Math.abs(allHistoricalTotalData[i].y - allHistoricalTotalData[i - 1].y);
      changeCount++;
    }

    const averageProfitChange = changeCount > 0 ? sumProfitChanges / changeCount : 0;
    const averageTotalChange = changeCount > 0 ? sumTotalChanges / changeCount : 0;

    setAvgMonthlyProfitChange(averageProfitChange);
    setAvgMonthlyTotalChange(averageTotalChange);

    // Calcular el margen de ganancia global y el incremento global
    const globalMargin = hasValidCategoryPredictions && totalPredictedSales > 0 ? (totalPredictedProfit / totalPredictedSales) * 100 : null;
    
    let currentTotalActualProfit = 0;
    let currentTotalActualSales = 0;

    targetCategories.forEach(cat => {
      const filteredSales = ventas.filter(v =>
        (v.Categoría || "").toLowerCase() === cat.toLowerCase()
      );

      const salesByDate = {};
      filteredSales.forEach(sale => {
        const dateParts = (sale.Fecha || "").split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const year = parseInt(dateParts[2], 10);
          const saleDate = new Date(year, month, day);
          const timestamp = saleDate.getTime();

          if (!isNaN(timestamp)) {
            if (!salesByDate[timestamp]) {
              salesByDate[timestamp] = { profit: 0, total: 0 };
            }
            salesByDate[timestamp].profit += (sale.Total || 0) - (sale.Costo || 0);
            salesByDate[timestamp].total += (sale.Total || 0);
          }
        }
      });

      const profitDataForRegression = Object.entries(salesByDate).map(([date, data]) => ({
        x: parseInt(date),
        y: data.profit
      })).sort((a, b) => a.x - b.x);

      if (profitDataForRegression.length > 0) {
        currentTotalActualProfit += profitDataForRegression[profitDataForRegression.length - 1].y;
      }
    });

    const globalIncrement = (currentTotalActualProfit !== null && currentTotalActualProfit > 0 && hasValidCategoryPredictions) ? ((totalPredictedProfit - currentTotalActualProfit) / currentTotalActualProfit) * 100 : null;

    setPredictedProfit(hasValidCategoryPredictions ? totalPredictedProfit.toFixed(2) : null);
    setPredictedTotal(hasValidCategoryPredictions ? totalPredictedSales.toFixed(2) : null);
    setPredictedMargin(globalMargin !== null ? globalMargin.toFixed(2) : null);
    setPredictedIncrement(globalIncrement !== null ? globalIncrement.toFixed(2) : null);
    setShowPredictionResults(true); // Mostrar resultados después de la predicción exitosa

  }, [predictionYear, categoryFilter, ventas, availableCategories, calcularPrediccionCategoria]);

  // Trigger prediction calculation when relevant dependencies change
  useEffect(() => {
    if (showPredictionResults) {
      calculatePrediction();
    }
  }, [predictionYear, categoryFilter, ventas, availableCategories, calcularPrediccionCategoria, showPredictionResults]);

  // Collect historical data and combine with predictions
  useEffect(() => {
    if (predictionYear && ventas.length > 0) {
      let allLabels = new Set();
      let combinedProfitData = {};
      let combinedTotalData = {};

      const targetCategories = categoryFilter.trim() === "" ? availableCategories : [categoryFilter];

      targetCategories.forEach(cat => {
        const { profitDataForRegression, totalDataForRegression } = calcularPrediccionCategoria(cat); // Re-run to get historical data
        
        if (profitDataForRegression) {
          profitDataForRegression.forEach(item => {
            const date = new Date(item.x).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            allLabels.add(date);
            if (!combinedProfitData[date]) combinedProfitData[date] = 0;
            combinedProfitData[date] += item.y;
          });
        }
        if (totalDataForRegression) {
          totalDataForRegression.forEach(item => {
            const date = new Date(item.x).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            allLabels.add(date);
            if (!combinedTotalData[date]) combinedTotalData[date] = 0;
            combinedTotalData[date] += item.y;
          });
        }
      });

      const futureDateObj = new Date(predictionYear, 0, 1); // Use the state variable predictionYear
      const futureMonthYear = new Date(predictionYear, 11, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); // December of predictionYear
      const futureDateTimestamp = new Date(predictionYear, 11, 31).getTime(); // End of the prediction year for timestamp

      // Determine the latest historical year from the data
      const latestHistoricalYear = ventas.reduce((maxYear, sale) => {
        const dateParts = (sale.Fecha || "").split('/');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[2], 10);
          return Math.max(maxYear, year);
        }
        return maxYear;
      }, 0);

      // Generate labels for all 12 months of the prediction year
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      let fullYearLabels = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(predictionYear, i, 1);
        fullYearLabels.push(date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
      }

      let finalProfitDataFullRange = [];
      let finalTotalDataFullRange = [];

      if (predictionYear > latestHistoricalYear) {
        // For future years, project for each month using the global regression
        if (globalProfitSlope !== null && globalProfitIntercept !== null && globalTotalSlope !== null && globalTotalIntercept !== null) {
          fullYearLabels.forEach((label, index) => {
            const monthStartTimestamp = new Date(predictionYear, index, 1).getTime();
            let projectedProfit = globalProfitSlope * monthStartTimestamp + globalProfitIntercept;
            let projectedTotal = globalTotalSlope * monthStartTimestamp + globalTotalIntercept;

            // Apply sinusoidal offset for visual fluctuation
            const fluctuationFactor = 0.5; // Adjust this value to control the intensity of the fluctuation
            const profitOffset = avgMonthlyProfitChange * Math.sin(index * Math.PI / 6) * fluctuationFactor;
            const totalOffset = avgMonthlyTotalChange * Math.sin(index * Math.PI / 6) * fluctuationFactor;

            projectedProfit += profitOffset;
            projectedTotal += totalOffset;

            projectedProfit = Math.max(0, projectedProfit);
            projectedTotal = Math.max(0, projectedTotal);

            finalProfitDataFullRange[index] = projectedProfit;
            finalTotalDataFullRange[index] = projectedTotal;
          });
        } else {
          // If global regression failed, set all future year data to null
          fullYearLabels.forEach((label, index) => {
            finalProfitDataFullRange[index] = null;
            finalTotalDataFullRange[index] = null;
          });
        }
      } else {
        // For current/past years, combine historical data with the December prediction
        const totalPredictedProfitForChart = parseFloat(predictedProfit);
        const totalPredictedSalesForChart = parseFloat(predictedTotal);

        finalProfitDataFullRange = fullYearLabels.map(label => {
          if (label === futureMonthYear) {
            return totalPredictedProfitForChart;
          }
          return combinedProfitData[label] !== undefined ? combinedProfitData[label] : null;
        });

        finalTotalDataFullRange = fullYearLabels.map(label => {
          if (label === futureMonthYear) {
            return totalPredictedSalesForChart;
          }
          return combinedTotalData[label] !== undefined ? combinedTotalData[label] : null;
        });
      }

      setChartLabels(fullYearLabels.map(label => label.split(' ')[0]));
      setChartProfitData(finalProfitDataFullRange);
      setChartTotalData(finalTotalDataFullRange);
    }
  }, [predictionYear, categoryFilter, ventas, availableCategories, calcularPrediccionCategoria, predictedProfit, predictedTotal, globalProfitSlope, globalProfitIntercept, globalTotalSlope, globalTotalIntercept, avgMonthlyProfitChange, avgMonthlyTotalChange]);

  const handlePredictClick = () => {
    if (predictionYear) {
      setShowPredictionResults(true); // Activar la visualización y las actualizaciones automáticas
    } else {
      // Si no hay fecha, reseteamos las predicciones y ocultamos los resultados
      setPredictedProfit(null);
      setPredictedTotal(null);
      setPredictedMargin(null);
      setPredictedIncrement(null);
      setCategoryProfits({});
      setShowPredictionResults(false);
      setChartLabels([]);
      setChartProfitData([]);
      setChartTotalData([]);
    }
  };

  // Datos para el gráfico de líneas de predicciones
  const predictionLineData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Ganancia (S/)',
        data: chartProfitData,
        borderColor: '#81e6d9',
        backgroundColor: 'rgba(129, 230, 217, 0.2)',
        fill: true,
        tension: 0.4,
        spanGaps: true,
      },
      {
        label: 'Ventas Totales (S/)',
        data: chartTotalData,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
        spanGaps: true,
      },
    ],
  };

  const predictionLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#ffffff' },
      },
      title: {
        display: true,
        text: 'Tendencia de Ganancia y Ventas Predichas',
        color: '#ffffff',
      },
    },
    scales: {
      x: {
        type: 'category',
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: {
          color: '#ffffff',
          callback: function(value, index, values) {
            return 'S/ ' + value.toLocaleString();
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: true,
      },
    },
  };

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
              <label htmlFor="file-input" className="file-input-label">
                Subir CSV
              </label>
            </div>
            <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="predictions-stats-charts-container">
            <div className="prediction-input-group">
              <label htmlFor="predictionYear">Selecciona un año:</label>
              <select
                id="predictionYear"
                value={predictionYear}
                onChange={(e) => {
                  setPredictionYear(parseInt(e.target.value, 10));
                  /* setShowPredictionResults(false); // Ocultar resultados al cambiar el año */
                }}
                className="prediction-year-select"
              >
                {[...Array(10)].map((_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <button onClick={handlePredictClick} className="predict-button">Predecir</button>
            </div>

            <div className="predictions-stats-grid">
              <div className="prediction-stat-card">
                <h3>TOTAL PREDECIDO</h3>
                <p className="prediction-stat-value">{showPredictionResults && predictedTotal !== null ? `S/${predictedTotal}` : 'N/A'}</p>
              </div>
              <div className="prediction-stat-card">
                <h3>MARGEN DE GANANCIA PREDECIDO</h3>
                <p className="prediction-stat-value">{showPredictionResults && predictedMargin !== null ? `${predictedMargin}%` : 'N/A'}</p>
              </div>
              <div className="prediction-stat-card">
                <h3>INCREMENTO PREDECIDO</h3>
                <p className="prediction-stat-value">{showPredictionResults && predictedIncrement !== null ? `${predictedIncrement}%` : 'N/A'}</p>
              </div>
            </div>

            <div className="predictions-charts-grid">
              <div className="prediction-chart-card">
                <h2>Tendencia de Ganancia y Ventas</h2>
                <div className="prediction-chart-container">
                  {showPredictionResults && predictedProfit !== null && predictedTotal !== null ? (
                    <Line data={predictionLineData} options={predictionLineOptions} />
                  ) : (
                    <p>Selecciona una fecha futura y haz clic en "Predecir" para ver la predicción. Asegúrate de que tu archivo CSV tenga al menos dos entradas de venta con fechas, totales y costos válidos.</p>
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

export default Predicciones;