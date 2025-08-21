import React from 'react';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  // Datos de ejemplo
  const statsData = [
    { title: "Comitada Total Veracésica", value: "15", subtitle: "7" },
    { title: "Total Computatoria", value: "5/1498.70" },
    { title: "Total Ventas del Día", value: "5/1291.70" },
    { title: "Comunidades del Día", value: "5/291.70" },
    { title: "Mínima de Comunidades", value: "58.49%" }
  ];

  const chartData = [
    { label: "Categoría A", value: 120 },
    { label: "Categoría B", value: 90 },
    { label: "Categoría C", value: 60 },
    { label: "Categoría D", value: 30 }
  ];

  const paymentData = [
    { label: "Contado (PA)", value: 65 },
    { label: "Crédito (PA)", value: 35 }
  ];

  const transactionsData = [
    { id: 1, description: "Venta 1", amount: "150.00", condition: "Contado" },
    { id: 2, description: "Venta 2", amount: "200.50", condition: "Crédito" },
    { id: 3, description: "Venta 3", amount: "75.30", condition: "Contado" }
  ];

  // Componente para barras de gráfico
  const ChartBar = ({ label, value, maxValue }) => {
    const percentage = (value / maxValue) * 100;
    
    return (
      <div className="chart-bar">
        <div className="chart-bar-label">{label}</div>
        <div className="chart-bar-container">
          <div 
            className="chart-bar-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="chart-bar-value">{value}</div>
      </div>
    );
  };

  // Componente para condiciones de pago
  const PaymentCondition = ({ label, value }) => (
    <div className="payment-condition">
      <span className="payment-label">{label}</span>
      <span className="payment-value">{value}%</span>
      <div className="payment-bar">
        <div 
          className="payment-bar-fill" 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
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
        <h1>Instituto Social Veracésico</h1>
        <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
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
            <h2>Garanzías por Categoría</h2>
            <div className="chart-bars">
              {chartData.map((item, index) => (
                <ChartBar 
                  key={index}
                  label={item.label}
                  value={item.value}
                  maxValue={120}
                />
              ))}
            </div>
          </div>
          
          <div className="chart-card">
            <h2>Ventas por Condición de Pago</h2>
            <div className="payment-conditions">
              {paymentData.map((item, index) => (
                <PaymentCondition 
                  key={index}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="transactions-card">
          <h2>Listado de Transacciones del Día ({new Date().toLocaleDateString()})</h2>
          <div className="transactions-list">
            {transactionsData.map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;