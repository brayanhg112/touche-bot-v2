'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'te_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar inicial
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading favorites from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id];
        
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
      } catch (e) {
        console.error('Error saving to localStorage', e);
      }
      
      // Emitir evento para otros componentes
      window.dispatchEvent(new Event('favoritesChanged'));
      
      return newFavs;
    });
  };

  // Escuchar si otros componentes actualizan el storage (por ejemplo en otras pestañas o instancias)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setFavorites(JSON.parse(e.newValue));
      }
    };
    
    const handleCustomChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleCustomChange);
    };
  }, []);

  return { favorites, toggleFavorite, isLoaded };
}
