import { writable } from 'svelte/store';

export const settings = writable(
  typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('settings') || '{"darkMode": false, "unit": "C", "forecastDays": 5}') : { darkMode: false, unit: 'C', forecastDays: 5 }
);

settings.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('settings', JSON.stringify(value));
  }
});