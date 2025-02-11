import { useState, useEffect } from 'react';

export function useIsLocalNetwork() {
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const checkIsLocalNetwork = async () => {
      const hostname = window.location.hostname;
      
      // Если это localhost или 127.0.0.1, сразу считаем локальной сетью
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setIsLocal(true);
        return;
      }

      try {
        // Для остальных хостов проверяем через API
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;
        
        // Проверяем, является ли IP адрес локальным
        const isLocalIP = ip.startsWith('192.168.') || 
                         ip.startsWith('10.') || 
                         ip.startsWith('172.16.') ||
                         ip === '127.0.0.1';
        
        setIsLocal(isLocalIP);
      } catch (error) {
        // В случае ошибки считаем, что это локальная сеть
        // так как api.ipify.org недоступен в локальной сети
        setIsLocal(true);
      }
    };

    checkIsLocalNetwork();
  }, []);

  return isLocal;
}
