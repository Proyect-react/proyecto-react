// App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import Graficos from "./components/Graficos/Graficos";
import Predicciones from "./components/Predicciones/Predicciones";
import FaceLoginAdvanced from "./components/Login/FaceLoginAdvanced";
import { AuthProvider } from "./components/AuthWrapper/AuthWrapper";
import "./App.css";

// Solo rutas y lógica de autenticación en App.js
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Componente para proteger rutas privadas
  const PrivateRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated
                  ? <Navigate to="/dashboard" />
                  : <FaceLoginAdvanced onLogin={handleLogin} />
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard onLogout={handleLogout} />
                </PrivateRoute>
              }
            />
            <Route
              path="/graficos"
              element={
                <PrivateRoute>
                  <Graficos onLogout={handleLogout} />
                </PrivateRoute>
              }
            />
            <Route
              path="/predicciones"
              element={
                <PrivateRoute>
                  <Predicciones onLogout={handleLogout} />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;