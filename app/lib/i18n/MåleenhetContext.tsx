'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Målesystem = 'metrisk' | 'imperisk';

type MåleenhetContextType = {
  målesystem: Målesystem;
  setMålesystem: (system: Målesystem) => void;
  formaterVekt: (kg: number) => string;
  formaterLengde: (cm: number) => string;
  formaterVæske: (ml: number) => string;
  formaterTemp: (celsius: number) => string;
};

const MåleenhetContext = createContext<MåleenhetContextType>({
  målesystem: 'metrisk',
  setMålesystem: () => {},
  formaterVekt: (kg) => `${kg} kg`,
  formaterLengde: (cm) => `${cm} cm`,
  formaterVæske: (ml) => `${ml} ml`,
  formaterTemp: (c) => `${c}°C`,
});

export function MåleenhetProvider({ children }: { children: ReactNode }) {
  const [målesystem, setMålesystemState] = useState<Målesystem>('metrisk');

  useEffect(() => {
    const lagret = localStorage.getItem('lille_målesystem') as Målesystem;
    if (lagret === 'metrisk' || lagret === 'imperisk') setMålesystemState(lagret);
  }, []);

  const setMålesystem = (system: Målesystem) => {
    setMålesystemState(system);
    localStorage.setItem('lille_målesystem', system);
  };

  const formaterVekt = (kg: number): string => {
    if (målesystem === 'imperisk') {
      const lbs = Math.floor(kg * 2.20462);
      const oz = Math.round((kg * 2.20462 - lbs) * 16);
      return oz > 0 ? `${lbs} lb ${oz} oz` : `${lbs} lb`;
    }
    return `${kg} kg`;
  };

  const formaterLengde = (cm: number): string => {
    if (målesystem === 'imperisk') {
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inn = Math.round(totalIn % 12);
      return ft > 0 ? `${ft}' ${inn}"` : `${inn}"`;
    }
    return `${cm} cm`;
  };

  const formaterVæske = (ml: number): string => {
    if (målesystem === 'imperisk') {
      return `${(ml * 0.033814).toFixed(1)} fl oz`;
    }
    return `${ml} ml`;
  };

  const formaterTemp = (celsius: number): string => {
    if (målesystem === 'imperisk') {
      return `${((celsius * 9/5) + 32).toFixed(1)}°F`;
    }
    return `${celsius}°C`;
  };

  return (
    <MåleenhetContext.Provider value={{ målesystem, setMålesystem, formaterVekt, formaterLengde, formaterVæske, formaterTemp }}>
      {children}
    </MåleenhetContext.Provider>
  );
}

export const useMåleenhet = () => useContext(MåleenhetContext);
