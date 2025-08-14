import { useState, useEffect } from 'react';
import Theme from '@jetbrains/ring-ui-built/components/global/theme';

export const useThemeDetection = () => {
  const [currentTheme, setCurrentTheme] = useState<typeof Theme.LIGHT | typeof Theme.DARK>(Theme.LIGHT);
  
  useEffect(() => {
    const detectTheme = () => {      
      setCurrentTheme(document.body.classList.contains('ring-ui-theme-dark') ? Theme.DARK : Theme.LIGHT);
    };
    
    detectTheme();
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  return currentTheme;
};
