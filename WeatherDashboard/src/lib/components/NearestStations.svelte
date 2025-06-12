<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { settings } from '$lib/stores/settings.js';

  let stations = $state([]);
  let weatherData = $state({});
  let error = $state(null);
  let { onSelect, initialLocation } = $props();

  function generateRandomLocation() {
    const adjectives = ['North', 'South', 'East', 'West', 'Central'];
    const nouns = ['Plains', 'Hills', 'Valley', 'Ridge', 'Meadow'];
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} Station`;
    return {
      name: name,
      latitude: (Math.random() * 180 - 90).toFixed(4) * 1,
      longitude: (Math.random() * 360 - 180).toFixed(4) * 1,
      distance: (Math.random() * 100).toFixed(1) * 1, // Distance in km
      id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` // Unique ID
    };
  }

  function generateRandomStations() {
    return Array.from({ length: 5 }, () => generateRandomLocation());
  }

  $effect(() => {
    if (initialLocation) {
      stations = generateRandomStations();
    }
  });

  onMount(() => {
    if (!initialLocation) {
      stations = generateRandomStations();
    }
  });

  // Fetch weather data for all stations
  $effect(() => {
    stations.forEach(async (station) => {
      if (!weatherData[station.id || getUniqueKey(station)]) {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.latitude}&longitude=${station.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          const data = await res.json();
          weatherData[station.id || getUniqueKey(station)] = {
            temperature: $settings.unit === 'F' ? celsiusToFahrenheit(data.current.temperature_2m) : data.current.temperature_2m,
            condition: getWeatherIcon(data.current.weather_code),
            high: $settings.unit === 'F' ? celsiusToFahrenheit(data.daily.temperature_2m_max[0]) : data.daily.temperature_2m_max[0],
            low: $settings.unit === 'F' ? celsiusToFahrenheit(data.daily.temperature_2m_min[0]) : data.daily.temperature_2m_min[0],
            time: new Date(data.current.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
        } catch (err) {
          console.error(`Failed to fetch weather for ${station.name}:`, err);
          weatherData[station.id || getUniqueKey(station)] = { error: 'Weather data unavailable' };
        }
      }
    });
  });

  function celsiusToFahrenheit(celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  }

  function getUniqueKey(station) {
    return station.id || `${station.latitude}_${station.longitude}`;
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

  function handleClick(station) {
    onSelect(station);
  }
</script>

<div transition:fade={{ duration: 300 }} class="mt-6">
  <h3 class="text-xl font-semibold mb-4">Nearest Weather Stations</h3>
  {#if error}
    <p class="text-red-500">{error}</p>
  {:else if stations.length > 0}
    <div class="grid grid-cols-1 gap-4">
      {#each stations as station}
        <div 
          class="bg-blue-200 p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-blue-300 transition"
          onclick={() => handleClick(station)}
          onkeydown={(e) => e.key === 'Enter' && handleClick(station)}
          role="button"
          tabindex="0"
        >
          <div>
            <p class="font-medium text-lg">{station.name}</p>
            <p class="text-sm text-gray-700">
              {weatherData[station.id || getUniqueKey(station)]?.time || 'N/A'}
            </p>
            <p class="text-xs text-gray-600">{station.distance} km away</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold">
              {weatherData[station.id || getUniqueKey(station)]?.temperature || '--'}°{$settings.unit}
            </p>
            
            <p class="text-xs text-gray-500">
              H:{weatherData[station.id || getUniqueKey(station)]?.high || '--'}°{$settings.unit} 
              L:{weatherData[station.id || getUniqueKey(station)]?.low || '--'}°{$settings.unit}
            </p>
          </div>
          <p class="text-3xl">
            {weatherData[station.id || getUniqueKey(station)]?.condition || 'Loading...'}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-gray-600">Loading nearest stations...</p>
  {/if}
</div>