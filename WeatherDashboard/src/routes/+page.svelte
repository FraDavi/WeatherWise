<script>
  import SearchInput from '$lib/components/SearchInput.svelte';
  import WeatherCard from '$lib/components/WeatherCard.svelte';
  import DailyForecast from '$lib/components/DailyForecast.svelte';
  import Favorites from '$lib/components/Favorites.svelte';
  import NearestStations from '$lib/components/NearestStations.svelte';
  import { fade } from 'svelte/transition';
  import { favorites } from '$lib/stores/favorites.js';
  import { settings } from '$lib/stores/settings.js';
  import TemperatureGraph from '$lib/components/TemperatureGraph.svelte';

  let location = $state(null);
  let hourlyData = $state(null);
  let loadingGraph = $state(false);
  let errorGraph = $state(null);
  let backgroundClass = $state('bg-day-clear');
  let showFavorites = $state(false);
  let showSettings = $state(false);
  let showRain = $state(false); // Toggle for rain data

  $effect(() => {
    console.log('Effect triggered, location:', $state.snapshot(location));
    if (location && location.latitude && location.longitude) {
      fetchHourlyData(location.latitude, location.longitude);
    } else {
      hourlyData = null;
      errorGraph = 'No location selected';
      loadingGraph = false;
    }
  });

  async function fetchHourlyData(lat, lon) {
    loadingGraph = true;
    errorGraph = null;
    console.log(`Fetching hourly data for lat: ${lat}, lon: ${lon}`);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,rain&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      console.log('Raw API response:', data);
      const today = new Date().toISOString().split('T')[0];
      console.log('Filtering for today:', today);
      console.log('Raw hourly times:', data.hourly.time);
      let hourlyTemps = data.hourly.time
        .map((time, index) => {
          const date = new Date(time);
          return {
            time: date.toLocaleTimeString([], { hour: '2-digit', hour12: false }),
            temp: data.hourly.temperature_2m[index],
            rain: data.hourly.rain[index] || 0 // Rainfall in mm, default to 0 if undefined
          };
        })
        .filter(item => {
          const itemDate = new Date(data.hourly.time[0]).toISOString().split('T')[0];
          return itemDate === today;
        });
      if (hourlyTemps.length === 0) {
        console.warn('No data for today, using first 24 hours as fallback');
        hourlyTemps = data.hourly.time.slice(0, 24).map((time, index) => ({
          time: new Date(time).toLocaleTimeString([], { hour: '2-digit', hour12: false }),
          temp: data.hourly.temperature_2m[index],
          rain: data.hourly.rain[index] || 0
        }));
      }
      hourlyData = {
        labels: hourlyTemps.map(item => item.time),
        temps: hourlyTemps.map(item => $settings.unit === 'F' ? celsiusToFahrenheit(item.temp) : item.temp),
        rain: hourlyTemps.map(item => item.rain)
      };
      console.log('Processed hourlyData:', $state.snapshot(hourlyData));
    } catch (err) {
      errorGraph = `Failed to fetch hourly data: ${err.message}`;
      console.error('Hourly data fetch error:', err);
    } finally {
      loadingGraph = false;
    }
  }

  function celsiusToFahrenheit(celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  }

  function handleSelect(place) {
    console.log('Selected place:', $state.snapshot(place));
    location = place;
    updateBackground(place);
    showFavorites = false;
  }

  function handleRemoveFavorite(id) {
    if (location && (location.id === id || getUniqueKey(location) === id)) {
      location = null;
    }
  }

  function handleAddFavorite(place) {
    console.log('Attempting to add favorite:', $state.snapshot(place));
    const key = getUniqueKey(place);
    favorites.update(current => {
      if (!current.some(f => f.id === place.id || getUniqueKey(f) === key)) {
        console.log('Adding favorite:', $state.snapshot(place));
        return [...current, { ...place, id: place.id || key }];
      }
      return current;
    });
    console.log('Favorite added:', $state.snapshot(place));
  }

  function updateBackground(place) {
    const isDarkMode = $settings.darkMode;
    const baseClass = isDarkMode ? 'bg-night-clear' : 'bg-day-clear';
    backgroundClass = `${baseClass} ${Math.random() > 0.5 ? '-alt' : ''}`.trim();
  }

  function getUniqueKey(place) {
    return place.id || `${place.latitude}_${place.longitude}`;
  }

  function isLocationFavorite(location) {
    if (!location || !$favorites) return false;
    return $favorites.some(f => f.id === location.id || getUniqueKey(f) === getUniqueKey(location));
  }

  $effect(() => {
    if (!showSettings) {
      updateBackground(location);
    }
  });
</script>

<div class="min-h-screen {backgroundClass} bg-cover bg-center transition-all duration-1000">
  <div class="container mx-auto p-4 max-w-5xl">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">WeatherWise</h1>
      <div>
        <button 
          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mr-2"
          onclick={() => (showFavorites = !showFavorites)}
        >
                      
        {#if showFavorites}
<i class="material-icons text-red-500">favorite</i>
        {:else}
        <i class="material-icons">favorite</i>

        {/if}
        </button>
        <button 
          class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          onclick={() => (showSettings = !showSettings)}
        >
              <i class="material-icons">settings</i>

        </button>
      </div>
    </header>

    <div class="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      {#if !showFavorites && !showSettings}
        <div transition:fade={{ duration: 300 }}>
          <SearchInput onSelect={handleSelect} />
          {#if location}
            <WeatherCard 
              location={location} 
              isFavorite={isLocationFavorite(location)}
              onAddFavorite={handleAddFavorite}
            />
            <DailyForecast location={location} days={$settings.forecastDays} unit={$settings.unit} />
            {#if loadingGraph}
              <div class="text-center p-4">Loading temperature trend...</div>
            {:else if errorGraph}
              <div class="text-red-500 p-4">{errorGraph}</div>
            {:else if hourlyData}
              <div class="mt-6">
                <h3 class="text-xl font-semibold mb-4">Today's {showRain ? 'Rainfall' : 'Temperature'} Trend</h3>
                <button 
                  class="mb-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                  onclick={() => (showRain = !showRain)}
                >
                  Switch to {showRain ? 'Temperature' : 'Rain'}
                </button>
                {#if hourlyData.temps && hourlyData.temps.length > 0}
                  <TemperatureGraph 
                    data={{ ...hourlyData }} 
                    unit={$settings.unit} 
                    showRain={$state.snapshot(showRain)} 
                  />
                {:else}
                  <div class="text-center p-4 text-gray-500">No {showRain ? 'rainfall' : 'temperature'} data available for today.</div>
                {/if}
              </div>
            {/if}
          {/if}
        </div>
      {/if}

      {#if showFavorites}
        <div transition:fade={{ duration: 300 }}>
          {#if $favorites.length === 0}
            <NearestStations onSelect={handleSelect} />
          {:else}
            <Favorites 
              onSelect={handleSelect} 
              onRemove={handleRemoveFavorite}
            />
          {/if}
        </div>
      {/if}

      {#if showSettings}
        <div transition:fade={{ duration: 300 }} class="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6 border border-gray-200">
          <h3 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Settings</h3>
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <label class="text-lg text-gray-700">Dark Mode</label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  bind:checked={$settings.darkMode}
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-lg text-gray-700">Temperature Unit</label>
              <select bind:value={$settings.unit} class="p-2 pr-8 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none relative">
                <option value="C">°C</option>
                <option value="F">°F</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-lg text-gray-700">Forecast Days</label>
              <select bind:value={$settings.forecastDays} class="p-2 pr-8 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none relative">
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
            </div>
            <button 
              class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-300"
              onclick={() => (showSettings = false)}
            >
              Close
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
  }
  select:focus {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
  }
</style>