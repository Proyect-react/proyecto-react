import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Barra.css"; // Asegúrate de tener los estilos adecuados

const Barra = ({ onLogout, irAGraficos }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Función para manejar la navegación de los botones
  const handleNavegacion = (ruta) => {
    if (ruta === "/dashboard" || ruta === "/") {
      navigate("/"); // Productos
    } else if (ruta === "/graficos") {
      if (irAGraficos) {
        irAGraficos();
      } else {
        navigate("/graficos");
      }
    } else if (ruta === "/predicciones") {
      navigate("/predicciones");
    }
  };

  return (
    <div className="barra">
      <button
        className={`barra-btn${location.pathname === "/" ? " active" : ""}`}
        onClick={() => handleNavegacion("/")}
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
