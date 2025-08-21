import React from "react";

const Inicio = () => {
  return (
    <div className="dashboard">
      <header style={styles.header} className="dashboard-header">
        <h1>Registro de Ventas</h1>
      </header>
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
};

export default Inicio;
