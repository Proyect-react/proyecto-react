import React, { useState, createContext, useContext } from 'react';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Componente proveedor
export const AuthProvider = ({ children }) => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const value = {
    categoryFilter,
    setCategoryFilter,
    categorySearchTerm,
    setCategorySearchTerm,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
