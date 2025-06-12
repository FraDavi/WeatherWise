<script>
  let { onSelect, } = $props();
  let query = $state('');
  let results = $state([]);
  let controller;
  let loading = $state(false);
  let error = $state(null);

  $effect(() => {
    if (query.length >= 3) {
      fetchSuggestions(query);
    } else {
      results = [];
      if (controller) controller.abort();
    }
  });

  async function fetchSuggestions(query) {
    if (controller) controller.abort();
    controller = new AbortController();
    loading = true;
    error = null;
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      results = data.results?.slice(0, 5) ?? [];
    } catch (err) {
      if (err.name !== 'AbortError') {
        error = 'Failed to fetch locations. Please try again.';
      }
    } finally {
      loading = false;
    }
  }

  function handleSelect(place) {
    query = `${place.name}, ${place.country}${place.admin1 ? ` (${place.admin1})` : ''}`;
    results = [];
    onSelect(place);
  }
</script>

<div class="relative">
  <input 
    bind:value={query} 
    placeholder="Search for a city..." 
    class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
  />
  
  {#if loading}
    <div class="absolute right-3 top-3">
      <svg class="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  {/if}

  {#if error}
    <p class="text-red-500 mt-2">{error}</p>
  {/if}

  {#if results.length > 0}
    <ul class="absolute w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-auto z-10">
      {#each results as place}
        <!-- svelte-ignore a11y_role_has_required_aria_props -->
        <li 
          class="p-3 hover:bg-blue-50 cursor-pointer transition-colors" 
          role="option"
          tabindex="0"
          onclick={() => handleSelect(place)}
          onkeydown={(e) => e.key === 'Enter' && handleSelect(place)}
        >
          {place.name}, {place.country} {place.admin1 ? `(${place.admin1})` : ''}
        </li>
      {/each}
    </ul>
  {/if}
</div>