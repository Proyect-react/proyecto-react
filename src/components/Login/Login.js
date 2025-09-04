import React from "react";
import "./Login.css"; // Asegúrate de importar tu CSS

function Login({ onLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="login-contenedor">
      <div className="login-centro">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Usuario" required />
          <input type="password" placeholder="Contraseña" required />
          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
