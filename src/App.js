import React, { useState } from 'react';
import Login from './login';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para manejar login exitoso
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;