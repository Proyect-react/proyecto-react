import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Barra.css";

const Barra = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Función para manejar la navegación de los botones
  const handleNavegacion = (ruta) => {
    navigate(ruta);
  };

  return (
    <div className="barra">
      <button
        className={`barra-btn${location.pathname === "/dashboard" ? " active" : ""}`}
        onClick={() => handleNavegacion("/dashboard")}
      >
        Productos
      </button>
      <button
        className={`barra-btn${location.pathname === "/graficos" ? " active" : ""}`}
        onClick={() => handleNavegacion("/graficos")}
      >
        Reporte
      </button>
      <button
        className={`barra-btn${location.pathname === "/predicciones" ? " active" : ""}`}
        onClick={() => handleNavegacion("/predicciones")}
      >
        Predicciones
      </button>
      <button onClick={onLogout} className="logout-btn" style={{ marginTop: '1rem' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Barra;