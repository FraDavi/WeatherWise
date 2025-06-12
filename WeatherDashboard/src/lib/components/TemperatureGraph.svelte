<script>
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto';

  let { data, unit } = $props();
  let chartCanvas;
  let chartInstance = $state(null);

  onMount(() => {
    console.log('onMount triggered, data:', data); // Debug onMount
    if (chartCanvas && data && data.temps && data.temps.length > 0) {
      if (chartInstance) chartInstance.destroy();
      const chartData = {
        labels: [...data.labels],
        datasets: [{
          label: `Temperature (°${unit})`,
          data: [...data.temps],
          borderColor: 'rgba(54, 162, 235, 1)', // Bright blue line
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, 'rgba(54, 162, 235, 0.4)');
            gradient.addColorStop(1, 'rgba(54, 162, 235, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.3, // Smoother curve
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)'
        }]
      };
      chartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: '#333',
                font: { size: 14 }
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: `Temperature (°${unit})`,
                color: '#333',
                font: { size: 14 }
              },
              grid: {
                color: 'rgba(200, 200, 200, 0.2)'
              },
              ticks: {
                color: '#555'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time',
                color: '#333',
                font: { size: 14 }
              },
              grid: {
                color: 'rgba(200, 200, 200, 0.2)'
              },
              ticks: {
                color: '#555'
              }
            }
          }
        }
      });
      console.log('Chart initialized with data:', chartData);
    } else {
      console.log('No valid data for chart initialization:', data);
    }
    return () => {
      if (chartInstance) chartInstance.destroy();
    };
  });

  $effect(() => {
    console.log('$effect triggered, data:', data); // Debug $effect
    if (chartInstance && data && data.temps && data.temps.length > 0) {
      const newChartData = {
        labels: [...data.labels],
        datasets: [{
          label: `Temperature (°${unit})`,
          data: [...data.temps],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, 'rgba(54, 162, 235, 0.4)');
            gradient.addColorStop(1, 'rgba(54, 162, 235, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)'
        }]
      };
      chartInstance.data = newChartData;
      chartInstance.options.scales.y.title.text = `Temperature (°${unit})`;
      chartInstance.update();
      console.log('Chart updated with data:', newChartData);
    } else {
      console.log('No valid data for chart update:', data);
    }
  });
</script>

<div class="p-4 bg-white rounded-lg shadow-lg">
  <canvas bind:this={chartCanvas} style="height: 200px;"></canvas>
</div>