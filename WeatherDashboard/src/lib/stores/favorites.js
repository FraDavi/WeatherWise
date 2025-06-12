import { writable } from 'svelte/store';

export const favorites = writable(
  typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('favorites') || '[]') : []
);

favorites.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('favorites', JSON.stringify(value));
  }
});