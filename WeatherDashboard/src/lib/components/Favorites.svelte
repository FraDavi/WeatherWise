<script>
  import { fade } from 'svelte/transition';
  import { favorites } from '$lib/stores/favorites.js';
  import { settings } from '$lib/stores/settings.js';

  let weatherData = $state({});

  $effect(() => {
    $favorites.forEach(async (place) => {
      if (!weatherData[place.id || getUniqueKey(place)]) {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          const data = await res.json();
          weatherData[place.id || getUniqueKey(place)] = {
            temperature: $settings.unit === 'F' ? celsiusToFahrenheit(data.current.temperature_2m) : data.current.temperature_2m,
            condition: getWeatherIcon(data.current.weather_code),
            high: $settings.unit === 'F' ? celsiusToFahrenheit(data.daily.temperature_2m_max[0]) : data.daily.temperature_2m_max[0],
            low: $settings.unit === 'F' ? celsiusToFahrenheit(data.daily.temperature_2m_min[0]) : data.daily.temperature_2m_min[0],
            time: new Date(data.current.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
        } catch (err) {
          console.error(`Failed to fetch weather for ${place.name}:`, err);
          weatherData[place.id || getUniqueKey(place)] = { error: 'Weather data unavailable' };
        }
      }
    });
  });

  function celsiusToFahrenheit(celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  }

  function getUniqueKey(place) {
    return place.id || `${place.latitude}_${place.longitude}`;
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

  let { onSelect, onRemove } = $props();

  function handleClick(place) {
    onSelect(place);
  }

  function removeFavorite(event, id) {
    event.stopPropagation(); // Prevent event bubbling
    favorites.update(current => current.filter(f => f.id !== id && getUniqueKey(f) !== id));
    onRemove(id);
  }
</script>

<div transition:fade={{ duration: 300 }} class="mt-6">
  <h3 class="text-xl font-semibold mb-4">Favorite Locations</h3>
  {#if $favorites.length === 0}
    <p class="text-gray-600">No favorite locations saved yet.</p>
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each $favorites as place}
        <div 
          class="bg-blue-200 p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-blue-300 transition"
          onclick={() => handleClick(place)}
          onkeydown={(e) => e.key === 'Enter' && handleClick(place)}
          role="button"
          tabindex="0"
        >
          <div>
            <p class="font-medium text-lg">{place.name}</p>
            <p class="text-sm text-gray-700">
              {weatherData[place.id || getUniqueKey(place)]?.time || 'N/A'}
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold">
              {weatherData[place.id || getUniqueKey(place)]?.temperature || '--'}°{$settings.unit}
            </p>
            
            <p class="text-xs text-gray-500">
              H:{weatherData[place.id || getUniqueKey(place)]?.high || '--'}°{$settings.unit} 
              L:{weatherData[place.id || getUniqueKey(place)]?.low || '--'}°{$settings.unit}
            </p>
            
          </div>
          <p class="text-3xl">
              {weatherData[place.id || getUniqueKey(place)]?.condition || 'Loading...'}
            </p>
          <button 
            class="text-black-500 hover:text-red-700 ml-4"
            onclick={(event) => removeFavorite(event, place.id || getUniqueKey(place))}
          >
                    <i class="material-icons">delete</i>

          </button>
        </div>
        
      {/each}
    </div>
  {/if}
</div>