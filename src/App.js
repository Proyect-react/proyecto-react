// App.js
import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Barra from "./components/Barra/Barra";
import Dashboard from "./components/Dashboard/Dashboard";
import Graficos from "./components/Graficos/Graficos";
import Predicciones from "./components/Predicciones/Predicciones";

function App() {
  const handleLogout = () => {
    console.log("Cerrar sesión");
    // Aquí tu lógica de logout
  };

  const irAGraficos = () => {
    console.log("Ir a gráficos desde Barra");
    // Lógica adicional si quieres manejar navegación especial
  };

  return (
    <BrowserRouter>
      <Barra onLogout={handleLogout} irAGraficos={irAGraficos} />
      <div style={{ marginLeft: "220px", paddingTop: "4.3rem" }}>
        {/* Ajuste de margen para que el contenido no quede debajo de la barra y el header */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/graficos" element={<Graficos />} />
          <Route path="/predicciones" element={<Predicciones />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
