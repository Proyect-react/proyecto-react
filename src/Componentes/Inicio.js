import React from "react";

const Inicio = () => {
  return (
    <div className="dashboard">
      <header style={styles.header} className="dashboard-header">
        <h1>Registro de Ventas</h1>
      </header>
      <div style={styles.cardContainer} className="card-container">
        <div style={styles.card} className="card">
          <h2>Metodo de Pago Mas Utilizado</h2>
          <p>Información sobre la venta...</p>
        </div>
        <div style={styles.card} className="card">
          <h2>Total de Ventas</h2>
          <p>Información sobre la venta...</p>
        </div>
        <div style={styles.card} className="card">
          <h2>Ultima Ventas</h2>
          <p>Información sobre la venta...</p>
        </div>
        <div style={styles.card} className="card">
          <h2>Total de Registros</h2>
          <p>Información sobre la venta...</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    backgroundColor: "#ffffffff",
    padding: "20px",
    textAlign: "center",
    borderRadius: "10px",
    borderBottom: "1px solid #eee",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
    margin: "20px auto",
    maxWidth: "1000px",
  },
  card: {
    backgroundColor: "#cececeff",
    fontSize: "10px",
    textAlign: "center",
    margin: "2px",
    maxWidth: "150px",
    padding: "30px",
    border: "1px solid #eee",
    fontWeight: "bold",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    flex: "0 0 auto",
  },
};

export default Inicio;
