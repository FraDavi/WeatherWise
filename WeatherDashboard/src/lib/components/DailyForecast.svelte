
<script>
  import { fade } from 'svelte/transition';
  let { location, days = $bindable(5), unit = $bindable('C') } = $props();
  let forecast = $state([]);
  let loading = $state(true);
  let error = $state(null);

  $effect(() => {
    if (location && location.latitude && location.longitude) {
      console.log('Fetching forecast for:', { lat: location.latitude, lon: location.longitude });
      fetchForecast(location.latitude, location.longitude);
    } else {
      error = 'Invalid location data';
      loading = false;
    }
  });

  async function fetchForecast(lat, lon) {
    loading = true;
    error = null;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (!data.daily) throw new Error('Invalid forecast data structure');
      const dayCount = Math.min(days, data.daily.time.length - 1);
      forecast = data.daily.time.slice(1, 1 + dayCount).map((time, i) => ({
        date: new Date(time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        maxTemp: unit === 'F' ? celsiusToFahrenheit(data.daily.temperature_2m_max[i + 1]) : data.daily.temperature_2m_max[i + 1],
        minTemp: unit === 'F' ? celsiusToFahrenheit(data.daily.temperature_2m_min[i + 1]) : data.daily.temperature_2m_min[i + 1],
        precipitation: data.daily.precipitation_sum[i + 1],
        weatherCode: data.daily.weather_code[i + 1]
      }));
    } catch (err) {
      error = `Failed to fetch forecast: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  function celsiusToFahrenheit(celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  }

  function getWeatherIcon(code) {
    if (code === 0) return '☀️'; // Clear sky
    if ([1, 2, 3].includes(code)) return '⛅'; // Cloudy
    if ([45, 48].includes(code)) return '🌫️'; // Fog
    if ([51, 53, 55].includes(code)) return '🌦️'; // Drizzle
    if ([56, 57].includes(code)) return '🥶🌦️'; // Freezing Drizzle
    if ([61, 63, 65].includes(code)) return '🌧️'; // Rain
    if ([66, 67].includes(code)) return '🥶🌧️'; // Freezing Rain
    if ([71, 73, 75].includes(code)) return '❄️'; // Snowfall
    if (code === 77) return '🌨️'; // Snow grains
    if ([80, 81, 82].includes(code)) return '🌦️'; // Rain showers
    if ([85, 86].includes(code)) return '🌨️'; // Snow showers
    if (code === 95) return '🌩️'; // Thunderstorm
    if ([96, 99].includes(code)) return '⛈️'; // Thunderstorm with hail
    return '❓'; // Unknown code
  }
</script>

{#if loading}
  <div class="text-center p-4">Loading forecast...</div>
{:else if error}
  <div class="text-red-500 p-4">{error}</div>
{:else if forecast.length > 0}
  <div transition:fade={{ duration: 300 }} class="mt-6">
    <h3 class="text-xl font-semibold mb-4">{days}-Day Forecast</h3>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4">
      {#each forecast as day}
        <div class="bg-white/80 p-4 rounded-lg shadow text-center">
          <p class="font-medium">{day.date}</p>
          <div class="text-3xl my-2">{getWeatherIcon(day.weatherCode)}</div>
          <p class="text-sm">High: {day.maxTemp}°{unit}</p>
          <p class="text-sm">Low: {day.minTemp}°{unit}</p>
          <p class="text-sm">Precipitation: {day.precipitation} mm</p>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="text-center p-4">No forecast data available.</div>
{/if}
