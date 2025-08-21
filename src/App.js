import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Componentes/login"; // Asegúrate de que la ruta sea correcta
import Inicio from "./Componentes/Inicio"; // Asegúrate de que la ruta sea correcta 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inicio" element={<Inicio />} />
      </Routes>
    </Router>
  );
}

export default App;