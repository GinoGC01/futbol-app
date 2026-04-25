import { createContext, useContext, useState, useEffect } from 'react';
import { useLigas } from '../hooks/useAdmin';

const LigaContext = createContext();

export function LigaProvider({ children }) {
  const { data: ligas, isLoading } = useLigas();
  const [ligaActiva, setLigaActiva] = useState(null);

  // Seleccionar liga inicial o restaurar de localStorage
  useEffect(() => {
    if (ligas?.length > 0) {
      const savedId = localStorage.getItem('liga_activa_id');
      const found = ligas.find(l => l.id === savedId);
      
      if (found) {
        setLigaActiva(found);
      } else {
        setLigaActiva(ligas[0]);
        localStorage.setItem('liga_activa_id', ligas[0].id);
      }
    } else if (ligas?.length === 0) {
      setLigaActiva(null);
    }
  }, [ligas]);

  const selectLiga = (liga) => {
    setLigaActiva(liga);
    if (liga) {
      localStorage.setItem('liga_activa_id', liga.id);
    }
  };

  return (
    <LigaContext.Provider value={{ 
      liga: ligaActiva, 
      setLiga: selectLiga, 
      ligas: ligas || [],
      isLoading 
    }}>
      {children}
    </LigaContext.Provider>
  );
}

export function useLigaActiva() {
  const context = useContext(LigaContext);
  if (!context) {
    throw new Error('useLigaActiva debe usarse dentro de un LigaProvider');
  }
  return context;
}
