// App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import Barra from "./components/Barra/Barra";
import Dashboard from "./components/Dashboard/Dashboard";
import Graficos from "./components/Graficos/Graficos";
import Predicciones from "./components/Predicciones/Predicciones";
import Login from "./components/Login/Login";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay una sesión activa al cargar la aplicación
  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    console.log("Cerrar sesión");
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <BrowserRouter>
      {isAuthenticated && <Barra onLogout={handleLogout} />}
      <div style={{ marginLeft: isAuthenticated ? "220px" : "0", paddingTop: isAuthenticated ? "4.3rem" : "0" }}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Login onLogin={handleLogin} />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/graficos" element={isAuthenticated ? <Graficos /> : <Navigate to="/" />} />
          <Route path="/predicciones" element={isAuthenticated ? <Predicciones /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;