/**
 * Analytics page JavaScript for FuelCell Monitor
 * Handles chart rendering and data filtering
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all charts
  initializeCharts();
  
  // Set up filter functionality
  setupFilters();
  
  // Update the time display
  updateTime();
  setInterval(updateTime, 1000);
});

// Update the time display
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
  });
  
  // Update header time
  const timeElements = document.querySelectorAll('#current-time, .time-display span');
  timeElements.forEach(element => {
      if (element) element.textContent = timeString;
  });
}

// Initialize all charts
function initializeCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded. Loading it dynamically...');
      
      // Dynamically load Chart.js
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = function() {
          createAllCharts();
      };
      document.head.appendChild(script);
  } else {
      createAllCharts();
  }
}

// Create all chart instances
function createAllCharts() {
  // System Performance Over Time
  createPerformanceChart();
  
  // Success Rate Pie Chart
  createSuccessRateChart();
  
  // Failure Distribution
  createFailureDistributionChart();
  
  // Temperature Trends
  createTemperatureChart();
  
  // Pressure Variations
  createPressureChart();
}

// Create System Performance chart
function createPerformanceChart() {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) {
    // If canvas doesn't exist, try to create it
    const container = document.querySelector('.chart-card.wide .placeholder-chart');
    if (container) {
      container.innerHTML = '<canvas id="performanceChart"></canvas>';
      const canvas = document.getElementById('performanceChart');
      if (!canvas) return;
      createPerformanceChartInstance(canvas);
    }
  } else {
    createPerformanceChartInstance(ctx);
  }
}

function createPerformanceChartInstance(ctx) {
  // Generate labels (past 24 hours with 2-hour intervals)
  const labels = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - i * 2);
      labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  }
  
  // Sample data
  const chart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [
              {
                  label: 'Success Rate (%)',
                  data: [85, 82, 90, 95, 88, 78, 84, 89, 92, 87, 91, 86, 89],
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y'
              },
              {
                  label: 'Process Time (s)',
                  data: [4.2, 4.5, 4.0, 3.8, 4.2, 4.7, 4.3, 4.1, 3.9, 4.0, 4.2, 4.3, 4.1],
                  borderColor: '#16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y1'
              }
          ]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              title: {
                  display: true,
                  text: 'System Performance'
              }
          },
          scales: {
              y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  min: 0,
                  max: 100,
                  title: {
                      display: true,
                      text: 'Success Rate (%)'
                  }
              },
              y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  min: 0,
                  max: 10,
                  grid: {
                      drawOnChartArea: false
                  },
                  title: {
                      display: true,
                      text: 'Process Time (s)'
                  }
              }
          }
      }
  });
}

// Create Success Rate pie chart
function createSuccessRateChart() {
  // Find the Success Rate chart container
  const containers = document.querySelectorAll('.chart-card .placeholder-chart');
  let successRateContainer = null;
  
  for (const container of containers) {
    if (container.textContent.includes('Success Rate')) {
      successRateContainer = container;
      break;
    }
  }
  
  if (!successRateContainer) return;
  
  // Create canvas
  successRateContainer.innerHTML = '<canvas id="successRateChart"></canvas>';
  
  const ctx = document.getElementById('successRateChart');
  if (!ctx) return;
  
  // Sample data
  const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: ['Success', 'Failure'],
          datasets: [{
              data: [87.5, 12.5],
              backgroundColor: ['#16a34a', '#dc2626'],
              hoverOffset: 4
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'bottom'
              },
              title: {
                  display: true,
                  text: 'Success vs Failure Rate'
              }
          }
      }
  });
}

// Create Failure Distribution chart
function createFailureDistributionChart() {
  // Find the Failure Distribution chart container
  const containers = document.querySelectorAll('.chart-card .placeholder-chart');
  let failureContainer = null;
  
  for (const container of containers) {
    if (container.textContent.includes('Failure Breakdown')) {
      failureContainer = container;
      break;
    }
  }
  
  if (!failureContainer) return;
  
  // Create canvas
  failureContainer.innerHTML = '<canvas id="failureDistributionChart"></canvas>';
  
  const ctx = document.getElementById('failureDistributionChart');
  if (!ctx) return;
  
  // Sample data
  const chart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['Fuel Cell Holes', 'Pipette', 'Flaps', 'Overflow'],
          datasets: [{
              label: 'Failure Count',
              data: [23, 8, 15, 4],
              backgroundColor: [
                  'rgba(220, 38, 38, 0.8)',
                  'rgba(217, 119, 6, 0.8)',
                  'rgba(202, 138, 4, 0.8)',
                  'rgba(2, 132, 199, 0.8)'
              ],
              borderColor: [
                  'rgb(220, 38, 38)',
                  'rgb(217, 119, 6)',
                  'rgb(202, 138, 4)',
                  'rgb(2, 132, 199)'
              ],
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  display: false
              },
              title: {
                  display: true,
                  text: 'Failure Distribution by Component'
              }
          },
          scales: {
              y: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: 'Count'
                  }
              }
          }
      }
  });
}

// Create Temperature Trends chart
function createTemperatureChart() {
  // Find the Temperature Trends chart container
  const containers = document.querySelectorAll('.chart-card .placeholder-chart');
  let temperatureContainer = null;
  
  for (const container of containers) {
    if (container.textContent.includes('Temperature Line Chart')) {
      temperatureContainer = container;
      break;
    }
  }
  
  if (!temperatureContainer) return;
  
  // Create canvas
  temperatureContainer.innerHTML = '<canvas id="temperatureChart"></canvas>';
  
  const ctx = document.getElementById('temperatureChart');
  if (!ctx) return;
  
  // Generate labels (past 24 hours with 2-hour intervals)
  const labels = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - i * 2);
      labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  }
  
  // Sample data with random variations around 24.3°C
  const temperatureData = [];
  for (let i = 0; i < 13; i++) {
      temperatureData.push(24.3 + (Math.random() * 2 - 1));
  }
  
  // Create chart
  const chart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: 'Temperature (°C)',
              data: temperatureData,
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.4
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              title: {
                  display: true,
                  text: 'Temperature Trends'
              }
          },
          scales: {
              y: {
                  min: 15,
                  max: 35,
                  title: {
                      display: true,
                      text: 'Temperature (°C)'
                  }
              }
          }
      }
  });
}

// Create Pressure Variations chart
function createPressureChart() {
  // Find the Pressure Variations chart container
  const containers = document.querySelectorAll('.chart-card .placeholder-chart');
  let pressureContainer = null;
  
  for (const container of containers) {
    if (container.textContent.includes('Pressure Area Chart')) {
      pressureContainer = container;
      break;
    }
  }
  
  if (!pressureContainer) return;
  
  // Create canvas
  pressureContainer.innerHTML = '<canvas id="pressureChart"></canvas>';
  
  const ctx = document.getElementById('pressureChart');
  if (!ctx) return;
  
  // Generate labels (past 24 hours with 2-hour intervals)
  const labels = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - i * 2);
      labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  }
  
  // Sample data with random variations around 106.5 kPa
  const pressureData = [];
  for (let i = 0; i < 13; i++) {
      pressureData.push(106.5 + (Math.random() * 4 - 2));
  }
  
  // Create chart
  const chart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: 'Pressure (kPa)',
              data: pressureData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              title: {
                  display: true,
                  text: 'Pressure Variations'
              }
          },
          scales: {
              y: {
                  min: 95,
                  max: 115,
                  title: {
                      display: true,
                      text: 'Pressure (kPa)'
                  }
              }
          }
      }
  });
}

// Set up filter functionality
function setupFilters() {
  const filterButton = document.querySelector('.filter-button');
  if (!filterButton) return;
  
  filterButton.addEventListener('click', function() {
      // Get filter values
      const timeRange = document.querySelector('select[id="timeRange"]').value;
      const component = document.querySelector('select[id="component"]').value;
      const status = document.querySelector('select[id="status"]').value;
      
      console.log(`Applying filters: Time=${timeRange}, Component=${component}, Status=${status}`);
      
      // In a real implementation, this would refresh the charts with filtered data
      // For demo purposes, just reload the current charts
      initializeCharts();
  });
}