import { useState, useEffect } from 'react';

export function useIsLocalNetwork() {
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        console.log('Checking network status...');
        const response = await fetch(`${window.location.origin}/api/check-local`, {
          cache: 'no-store',
        });
        
        const data = await response.json();
        console.log('Raw response:', response);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response data:', data);
        
        // Проверяем все возможные форматы ответа
        const isLocalNetwork = 
          data.isLocal === 1 || 
          data.isLocal === '1' || 
          data.isLocal === true;
        
        console.log('Final isLocal value:', isLocalNetwork);
        setIsLocal(isLocalNetwork);
      } catch (error) {
        console.error('Failed to check network location:', error);
        setIsLocal(false);
      }
    };

    checkNetwork();
  }, []);

  return isLocal;
}
