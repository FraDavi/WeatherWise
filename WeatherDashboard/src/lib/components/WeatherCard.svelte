<script>
  import { fade } from 'svelte/transition';
  let { location, isFavorite, onAddFavorite } = $props();
  let weather = $state(null);
  let loading = $state(true);
  let error = $state(null);
  import { settings } from '$lib/stores/settings.js';

  $effect(() => {
    if (location && location.latitude && location.longitude) {
      console.log('Fetching weather for:', { lat: location.latitude, lon: location.longitude });
      fetchWeather(location.latitude, location.longitude);
    } else {
      error = 'Invalid location data';
      loading = false;
    }
  });

  async function fetchWeather(lat, lon) {
    loading = true;
    error = null;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (!data.current) throw new Error('Invalid weather data structure');
      
      // Parse sunrise and sunset times
      const sunrise = data.daily?.sunrise?.[0] ? new Date(data.daily.sunrise[0]) : null;
      const sunset = data.daily?.sunset?.[0] ? new Date(data.daily.sunset[0]) : null;
      
      weather = {
        temperature: $settings.unit === 'F' ? celsiusToFahrenheit(data.current.temperature_2m) : data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        time: new Date(data.current.time).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }),
        sunrise: sunrise ? sunrise.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : 'N/A',
        sunset: sunset ? sunset.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : 'N/A'
      };
    } catch (err) {
      error = `Failed to fetch weather: ${err.message}`;
      console.error('Weather fetch error:', err);
    } finally {
      loading = false;
    }
  }

  function celsiusToFahrenheit(celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  }

  function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55].includes(code)) return '🌦️';
    if ([56, 57].includes(code)) return '🥶🌦️';
    if ([61, 63, 65].includes(code)) return '🌧️';
    if ([66, 67].includes(code)) return '🥶🌧️';
    if ([71, 73, 75].includes(code)) return '❄️';
    if (code === 77) return '🌨️';
    if ([80, 81, 82].includes(code)) return '🌦️';
    if ([85, 86].includes(code)) return '🌨️';
    if (code === 95) return '🌩️';
    if ([96, 99].includes(code)) return '⛈️';
    return '❓';
  }

  function getBackgroundClass(code) {
    if (code === 0) return 'bg-day-clear';
    if (code <= 3) return 'bg-day-cloudy';
    if (code <= 67) return 'bg-rainy';
    return 'bg-night-clear';
  }

  function openGoogleMaps() {
    if (location && location.latitude && location.longitude) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  }
</script>

{#if loading}
  <div class="text-center p-4">Loading weather data...</div>
{:else if error}
  <div class="text-red-500 p-4">{error}</div>
{:else if weather}
  <div transition:fade={{ duration: 300 }} class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white/80 rounded-lg shadow-lg {getBackgroundClass(weather.weatherCode)}">
    <div>
      <h2 class="text-2xl font-bold">{location.name}</h2>
      <p class="text-gray-600">{location.country} {location.admin1 ? `(${location.admin1})` : ''}</p>
      <p class="text-sm text-gray-500">Weather station: {location.name}</p>
      <p class="text-sm text-gray-500">Measured: {weather.time}</p>
      <div class="text-6xl mt-4">{getWeatherIcon(weather.weatherCode)}</div>
      
      <!-- Sunrise and Sunset Display -->
      <div class="mt-4 flex space-x-6">
        <div class="flex items-center space-x-2">
<i class="material-icons">wb_twilight</i>

          <div>
            <p class="text-xs text-gray-500">Sunrise</p>
            <p class="text-sm font-medium">{weather.sunrise}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
<i class="material-icons">brightness_2</i>

          <div>
            <p class="text-xs text-gray-500">Sunset</p>
            <p class="text-sm font-medium">{weather.sunset}</p>
          </div>
        </div>
      </div>
      
      <button 
        class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        onclick={() => {
          console.log('Add to Favorites clicked for:', location);
          onAddFavorite(location);
        }}
        disabled={isFavorite}
      >
        {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
      </button>
    </div>
    <div class="text-right">
      <p class="text-4xl font-semibold">{weather.temperature}°{$settings.unit}</p>
      <p class="text-gray-600">Humidity: {weather.humidity}%</p>
      <p class="text-gray-600">Precipitation: {weather.precipitation} mm</p>
      <p class="text-gray-600">Wind: {weather.windSpeed} km/h</p>
      <!-- Add Material Icons button for Google Maps -->
      <button
        class="mt-2 cursor-pointer focus:outline-none"
        onclick={openGoogleMaps}
        aria-label="Open Google Maps"
      >
        <i class="material-icons">place</i>
      </button>
    </div>
  </div>
{/if}

<style>
  /* Ensure Material Icons are loaded */
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  .material-icons {
    font-size: 24px; /* Adjust size as needed */
    color: #000; /* Match the text color or adjust */
  }
</style>