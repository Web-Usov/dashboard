
declare global {
  interface Window {
    __IS_LOCAL_NETWORK__?: boolean;
  }
}

export function useIsLocalNetwork() {
  // Теперь просто возвращаем значение из глобальной переменной
  return window.__IS_LOCAL_NETWORK__ ?? false;
}

// Функция для определения локальной сети
export async function checkIsLocalNetwork(): Promise<boolean> {
  return fetch(window.location.origin, {
    method: 'HEAD',
    cache: 'no-store'
  })
    .then(response => {
      const isLocal = response.headers.get('X-Local-Network');
      return isLocal === '1';
    })
    .catch(() => {
      const hostname = window.location.hostname;
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' || 
             hostname.endsWith('.local') || 
             hostname.endsWith('.localhost') ||
             hostname.startsWith('192.168.');
    });
}
