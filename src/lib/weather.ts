import { useState, useEffect } from 'react';

export function useRealWeather() {
  const [weather, setWeather] = useState<{ temp: string | number, condition: string, alert: string | null }>({ 
    temp: '--', 
    condition: 'Fetching...', 
    alert: null 
  });

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Kochi coordinates
        const lat = 9.9312; 
        const lng = 76.2673; 
        // Using Open-Meteo free API
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`);
        const data = await res.json();
        
        const temp = data.current.temperature_2m;
        const code = data.current.weather_code;
        
        let condition = 'Clear';
        let alert = null;
        
        // WMO Weather interpretation codes
        if (code === 0) condition = 'Clear sky';
        else if (code === 1 || code === 2 || code === 3) condition = 'Partly cloudy';
        else if (code === 45 || code === 48) condition = 'Fog';
        else if (code >= 51 && code <= 55) condition = 'Drizzle';
        else if (code >= 61 && code <= 65) condition = 'Rain';
        else if (code >= 71 && code <= 77) condition = 'Snow';
        else if (code >= 80 && code <= 82) condition = 'Showers';
        else if (code >= 95 && code <= 99) condition = 'Thunderstorm';
        
        // Weather-based alerts and road impacts are removed per user request
        
        setWeather({ temp: Math.round(temp).toString(), condition, alert });
      } catch (e) {
        setWeather({ temp: '--', condition: 'Unavailable', alert: null });
      }
    }
    
    fetchWeather();
  }, []);

  return weather;
}
