import React from "react";
import Barra from '../Barra/Barra';
import { useNavigate } from "react-router-dom";

const Predicciones = ({ onLogout }) => {
  const navigate = useNavigate();

  // Esta función permite que el botón "Reporte" navegue correctamente a /graficos
  const irAGraficos = () => {
    navigate("/graficos");
  };

  return (
    <div>
      <Barra onLogout={onLogout} irAGraficos={irAGraficos} />
      <div>Página de Predicciones</div>
    </div>
  );
};

export default Predicciones;