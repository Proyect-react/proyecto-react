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

  // Validar que onLogout sea una función antes de llamarla
  const handleLogout = (e) => {
    e.preventDefault();
    if (typeof onLogout === "function") {
      onLogout();
    } else {
      alert("Error: la función de cerrar sesión no está disponible.");
    }
  };

  return (
    <div className="barra">
      <button
        className={`barra-btn${location.pathname === "/dashboard" ? " active" : ""}`}
        onClick={() => handleNavegacion("/dashboard")}
        type="button"
      >
        Productos
      </button>
      <button
        className={`barra-btn${location.pathname === "/graficos" ? " active" : ""}`}
        onClick={() => handleNavegacion("/graficos")}
        type="button"
      >
        Reporte
      </button>
      <button
        className={`barra-btn${location.pathname === "/predicciones" ? " active" : ""}`}
        onClick={() => handleNavegacion("/predicciones")}
        type="button"
      >
        Predicciones
      </button>
      <button
        onClick={handleLogout}
        className="logout-btn"
        style={{ marginTop: '1rem' }}
        type="button"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Barra;