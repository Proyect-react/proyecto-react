// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'admin@12345.com' && password === '12345') {
      setError('');
      navigate('/inicio'); // 👈 Redirige a Inicio.jsx
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Login Técnico</h2>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button}>Ingresar</button>
      </form>
    </div>
  );
};


const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0f2f5', // Fondo suave
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    padding: '70px 30px',
    borderRadius: '20px',
    background: '#ffffff',
    boxShadow: '0 15px 35px rgba(0,0,0,0.15)', // sombra más elegante
    width: '350px',
    transition: 'all 0.3s ease',
  },
  title: {
    marginBottom: '45px',
    textAlign: 'center',
    color: '#222',
    fontFamily: 'Segoe UI, sans-serif',
  },
  input: {
    padding: '12px',
    marginBottom: '18px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    outline: 'none',
    fontSize: '20px',
    transition: '0.3s',
  },
  button: {
    padding: '12px',
    background: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    transition: '0.3s',
  },
  error: {
    color: 'red',
    marginBottom: '12px',
    textAlign: 'center',
  },
};

// Añadir efecto focus en inputs
styles.input = {
  ...styles.input,
  ':focus': {
    borderColor: '#007bff',
    boxShadow: '0 0 5px rgba(0, 123, 255, 0.5)',
  },
};

// Añadir efecto hover en botón
styles.button = {
  ...styles.button,
  ':hover': {
    background: '#0056b3',
  },
};

export default Login;