/**
 * Dashboard JavaScript for Flow Cell Monitoring Dashboard
 * Handles real-time updates, chart rendering, and status indicators
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard components
    initializeDashboard();
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Simulate real-time monitoring with updates
    setInterval(updateComponentStatus, 5000);
    setInterval(updateSensorReadings, 3000);

    // Add event listeners for manual status control (if needed)
    setupManualControls();
  });
  
  // Initialize all dashboard components
  function initializeDashboard() {
    // Create performance chart
    createPerformanceChart();
    
    // Initialize component statuses
    updateComponentStatus(true); // true = force initial update
    
    // Initialize sensor readings
    updateSensorReadings(true); // true = force initial update
  }
  
  // Update the time display
  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Update all time elements
    const timeElements = document.querySelectorAll('#current-time, .time-display span, [id^="time-"]');
    timeElements.forEach(element => {
      if (element) element.textContent = timeString;
    });
    
    // Update the "Updated at" text
    const updatedAtElements = document.querySelectorAll('.update-time');
    updatedAtElements.forEach(element => {
      if (element) element.textContent = `Updated at ${timeString}`;
    });
  }
  
  // Create Performance chart
  function createPerformanceChart() {
    const performanceContainer = document.querySelector('.chart-placeholder');
    
    if (!performanceContainer) return;
    
    // Clear the container and add a canvas
    performanceContainer.innerHTML = '<canvas id="performanceChart" style="width:100%;height:100%;min-height:200px;"></canvas>';
    
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    // Generate time labels for the last 10 minutes in 1-minute intervals
    const labels = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const time = new Date(now);
      time.setMinutes(now.getMinutes() - i);
      labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }
    
    // Sample performance data
    const successRateData = [92, 88, 85, 91, 93, 90, 84, 86, 83, 78];
    const cycleTimeData = [3.8, 4.2, 4.1, 3.9, 4.0, 4.2, 4.5, 4.4, 4.6, 4.8];
    
    // Use Chart.js to create the chart
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Success Rate (%)',
            data: successRateData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Cycle Time (s)',
            data: cycleTimeData,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
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
            text: 'Real-time Performance'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 70,
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
            min: 3,
            max: 5,
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Cycle Time (s)'
            }
          }
        }
      }
    });
    
    // Update the chart data periodically
    setInterval(() => {
      // Remove the oldest data point and add a new one
      chart.data.datasets[0].data.shift();
      chart.data.datasets[1].data.shift();
      
      // Add new random data
      const newSuccessRate = Math.max(75, Math.min(95, chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] + (Math.random() * 6 - 3)));
      const newCycleTime = Math.max(3.5, Math.min(5, chart.data.datasets[1].data[chart.data.datasets[1].data.length - 1] + (Math.random() * 0.4 - 0.2)));
      
      chart.data.datasets[0].data.push(newSuccessRate);
      chart.data.datasets[1].data.push(newCycleTime);
      
      // Update time labels
      chart.data.labels.shift();
      const now = new Date();
      chart.data.labels.push(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      
      chart.update();
    }, 5000);
  }
  
  // Set up manual controls for component statuses
  function setupManualControls() {
    // This function could add event listeners for buttons or UI controls
    // to manually change component statuses if such UI elements exist
    
    // For example, we could add a custom event that can be triggered from
    // external code or dev tools to change component statuses
    window.setComponentStatus = function(component, status) {
      let statuses = {};
      
      // Get current statuses first
      document.querySelectorAll('.component-item').forEach(item => {
        const nameElement = item.querySelector('.component-name span');
        const statusElement = item.querySelector('.component-status');
        if (nameElement && statusElement) {
          const name = nameElement.textContent.trim();
          statuses[name] = statusElement.textContent.trim();
        }
      });
      
      // Update the specified component status
      if (component && status) {
        statuses[component] = status;
      }
      
      // Update the UI with the new statuses
      Object.keys(statuses).forEach(componentName => {
        updateComponentStatusUI(componentName, statuses[componentName]);
      });
      
      // Update overall system status, live feed indicators, and alerts
      updateOverallStatus({
        flowCellHoles: statuses['Flow Cell Holes'],
        pipette: statuses['Pipette'],
        flaps: statuses['Flaps'],
        overflow: statuses['Overflow']
      });
      
      updateLiveFeedIndicators({
        flowCellHoles: statuses['Flow Cell Holes'],
        pipette: statuses['Pipette'],
        flaps: statuses['Flaps'],
        overflow: statuses['Overflow']
      });
      
      updateAlerts({
        flowCellHoles: statuses['Flow Cell Holes'],
        pipette: statuses['Pipette'],
        flaps: statuses['Flaps'],
        overflow: statuses['Overflow']
      });
    };
  }
  
  // Update component status indicators
  function updateComponentStatus(forceUpdate = false) {
    // Define possible statuses
    const statuses = {
      flowCellHoles: ['Detected', 'Not Detected'],
      pipette: ['Detected', 'Not Detected'],
      flaps: ['Open', 'Closed'],
      overflow: ['Normal', 'Warning', 'Critical']
    };
    
    // Get current statuses or set specific values if forced update
    let currentStatuses = {};
    
    if (forceUpdate) {
      // Initial setup - set statuses based on the image
      currentStatuses = {
        flowCellHoles: 'Not Detected',
        pipette: 'Detected',
        flaps: 'Closed',
        overflow: 'Normal'
      };
    } else {
      // For automatic updates, use a pattern that cycles through statuses
      // Get current time to create a consistent pattern
      const now = new Date();
      const cycleMinutes = now.getMinutes() % 10; // 0-9 minute cycle
      
      currentStatuses = {
        // Change Flow Cell Holes status based on minute (0-4: Not Detected, 5-9: Detected)
        flowCellHoles: cycleMinutes < 5 ? 'Not Detected' : 'Detected',
        
        // Change Pipette status based on minute (0-1, 5-6: Not Detected, others: Detected)
        pipette: (cycleMinutes % 5 < 2) ? 'Not Detected' : 'Detected',
        
        // Change Flaps status based on minute (0-2, 5-7: Closed, others: Open)
        flaps: (cycleMinutes % 5 < 3) ? 'Closed' : 'Open',
        
        // Change Overflow status based on minute (0: Critical, 1-2: Warning, others: Normal)
        overflow: cycleMinutes === 0 ? 'Critical' : (cycleMinutes < 3 ? 'Warning' : 'Normal')
      };
    }
    
    // Update the status in the UI
    updateComponentStatusUI('Flow Cell Holes', currentStatuses.flowCellHoles);
    updateComponentStatusUI('Pipette', currentStatuses.pipette);
    updateComponentStatusUI('Flaps', currentStatuses.flaps);
    updateComponentStatusUI('Overflow', currentStatuses.overflow);
    
    // Update overall system status
    updateOverallStatus(currentStatuses);
    
    // Update status indicators on the live feed
    updateLiveFeedIndicators(currentStatuses);
    
    // Update alerts based on status changes
    updateAlerts(currentStatuses);
  }
  
  // Helper function to update component status in the UI
  function updateComponentStatusUI(componentName, status) {
    // Find all component items
    const componentItems = document.querySelectorAll('.component-item');
    
    componentItems.forEach(item => {
      const nameElement = item.querySelector('.component-name span');
      if (nameElement && nameElement.textContent.trim() === componentName) {
        const statusElement = item.querySelector('.component-status');
        const iconElement = item.querySelector('.component-icon');
        
        if (statusElement) {
          // Update text
          statusElement.textContent = status;
          
          // Remove existing classes
          statusElement.classList.remove('success', 'warning', 'error');
          
          // Add appropriate class
          if (status === 'Detected' || status === 'Normal' || status === 'Open') {
            statusElement.classList.add('success');
          } else if (status === 'Warning' || status === 'Closed') {
            statusElement.classList.add('warning');
          } else {
            statusElement.classList.add('error');
          }
        }
        
        if (iconElement) {
          // Remove existing classes
          iconElement.classList.remove('success', 'warning', 'error');
          
          // Add appropriate class
          if (status === 'Detected' || status === 'Normal' || status === 'Open') {
            iconElement.classList.add('success');
            iconElement.innerHTML = componentName === 'Overflow' ? 
              '<i class="fas fa-tint"></i>' : 
              '<i class="fas fa-check-circle"></i>';
          } else if (status === 'Warning' || status === 'Closed') {
            iconElement.classList.add('warning');
            iconElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
          } else {
            iconElement.classList.add('error');
            iconElement.innerHTML = '<i class="fas fa-times"></i>';
          }
        }
      }
    });
  }
  
  // Update overall system status based on component statuses
  function updateOverallStatus(statuses) {
    let overallStatus = 'NORMAL';
    
    // Logic to determine overall status
    if (statuses.flowCellHoles === 'Not Detected' || statuses.overflow === 'Critical') {
      overallStatus = 'FAIL';
    } else if (statuses.flaps === 'Closed' || statuses.overflow === 'Warning') {
      overallStatus = 'WARNING';
    }
    
    // Update overall status indicator
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      // Update text
      statusIndicator.textContent = overallStatus;
      
      // Remove existing classes
      statusIndicator.classList.remove('success', 'warning', 'fail');
      
      // Add appropriate class
      if (overallStatus === 'NORMAL') {
        statusIndicator.classList.add('success');
      } else if (overallStatus === 'WARNING') {
        statusIndicator.classList.add('warning');
      } else {
        statusIndicator.classList.add('fail');
      }
    }
  }
  
  // Update the status indicators on the live feed
  function updateLiveFeedIndicators(statuses) {
    const overlayIndicators = document.querySelectorAll('.status-overlay');
    
    overlayIndicators.forEach(indicator => {
      const statusText = indicator.querySelector('span');
      
      if (statusText && statusText.textContent.includes('Overall')) {
        // Remove existing classes
        indicator.classList.remove('success', 'warning', 'fail');
        
        // Update based on overall status
        if (statuses.flowCellHoles === 'Not Detected' || statuses.overflow === 'Critical') {
          indicator.classList.add('fail');
          statusText.textContent = 'Overall: FAIL';
        } else if (statuses.flaps === 'Closed' || statuses.overflow === 'Warning') {
          indicator.classList.add('warning');
          statusText.textContent = 'Overall: WARNING';
        } else {
          indicator.classList.add('success');
          statusText.textContent = 'Overall: NORMAL';
        }
      } else if (statusText && statusText.textContent.includes('Overflow')) {
        // Remove existing classes
        indicator.classList.remove('success', 'warning', 'fail');
        
        // Update overflow indicator
        if (statuses.overflow === 'Critical') {
          indicator.classList.add('fail');
          statusText.textContent = 'Overflow: Critical';
        } else if (statuses.overflow === 'Warning') {
          indicator.classList.add('warning');
          statusText.textContent = 'Overflow: Warning';
        } else {
          indicator.classList.add('success');
          statusText.textContent = 'Overflow: Normal';
        }
      }
    });
  }
  
  // Update alerts based on status changes
  function updateAlerts(statuses) {
    const alertsContainer = document.querySelector('.alerts-container');
    if (!alertsContainer) return;
    
    // Create a new list of alerts
    let newAlerts = [];
    
    // Add alerts based on current statuses
    if (statuses.flowCellHoles === 'Not Detected') {
      newAlerts.push({
        title: 'Flow Cell Holes Not Detected',
        time: 'Just now',
        type: 'error'
      });
    }
    
    if (statuses.flaps === 'Closed') {
      newAlerts.push({
        title: 'Flaps Closed',
        time: 'Just now',
        type: 'warning'
      });
    }
    
    if (statuses.overflow === 'Critical') {
      newAlerts.push({
        title: 'Overflow Critical',
        time: 'Just now',
        type: 'error'
      });
    } else if (statuses.overflow === 'Warning') {
      newAlerts.push({
        title: 'Overflow Warning',
        time: 'Just now',
        type: 'warning'
      });
    }
    
    if (statuses.pipette === 'Not Detected') {
      newAlerts.push({
        title: 'Pipette Not Detected',
        time: 'Just now',
        type: 'error'
      });
    }
    
    // Keep only the most recent 3 alerts
    newAlerts = newAlerts.slice(0, 3);
    
    // Update the alerts container
    if (newAlerts.length > 0) {
      alertsContainer.innerHTML = '';
      
      newAlerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alert.type}`;
        
        alertItem.innerHTML = `
          <div class="alert-title">${alert.title}</div>
          <div class="alert-time">${alert.time}</div>
        `;
        
        alertsContainer.appendChild(alertItem);
      });
    }
  }
  
  // Update sensor readings with realistic variations
  function updateSensorReadings(forceUpdate = false) {
    // Base values for sensors
    const baseValues = {
      temperature: 24.3,
      pressure: 101.3,
      motion: 0.3,
      ultrasonic: 45.7
    };
    
    // Min/Max ranges for each sensor
    const ranges = {
      temperature: { min: 15, max: 35 },
      pressure: { min: 95, max: 105 },
      motion: { min: 0, max: 2 },
      ultrasonic: { min: 10, max: 60 }
    };
    
    // Get current values from the DOM or apply random variations
    let currentValues = {};
    
    if (forceUpdate) {
      currentValues = { ...baseValues };
    } else {
      // Apply random variations to each sensor
      const sensorItems = document.querySelectorAll('.sensor-item');
      
      sensorItems.forEach(item => {
        const nameElement = item.querySelector('.sensor-name span');
        const valueElement = item.querySelector('.sensor-value .value');
        
        if (nameElement && valueElement) {
          const sensorName = nameElement.textContent.trim().toLowerCase();
          const currentValue = parseFloat(valueElement.textContent);
          
          // Apply appropriate random variation based on sensor type
          if (sensorName === 'temperature') {
            currentValues.temperature = Math.max(
              ranges.temperature.min, 
              Math.min(
                ranges.temperature.max, 
                currentValue + (Math.random() * 1.0 - 0.5)
              )
            );
          } else if (sensorName === 'pressure') {
            currentValues.pressure = Math.max(
              ranges.pressure.min, 
              Math.min(
                ranges.pressure.max, 
                currentValue + (Math.random() * 1.0 - 0.5)
              )
            );
          } else if (sensorName === 'motion') {
            currentValues.motion = Math.max(
              ranges.motion.min, 
              Math.min(
                ranges.motion.max, 
                currentValue + (Math.random() * 0.3 - 0.15)
              )
            );
          } else if (sensorName === 'ultrasonic') {
            currentValues.ultrasonic = Math.max(
              ranges.ultrasonic.min, 
              Math.min(
                ranges.ultrasonic.max, 
                currentValue + (Math.random() * 2.0 - 1.0)
              )
            );
          }
        }
      });
    }
    
    // Update the values in the UI
    updateSensorUI('Temperature', currentValues.temperature.toFixed(1), '°C', ranges.temperature);
    updateSensorUI('Pressure', currentValues.pressure.toFixed(1), 'kPa', ranges.pressure);
    updateSensorUI('Motion', currentValues.motion.toFixed(1), 'mm/s', ranges.motion);
    updateSensorUI('Ultrasonic', currentValues.ultrasonic.toFixed(1), 'mm', ranges.ultrasonic);
  }
  
  // Helper function to update sensor UI
  function updateSensorUI(sensorName, value, unit, range) {
    const sensorItems = document.querySelectorAll('.sensor-item');
    
    sensorItems.forEach(item => {
      const nameElement = item.querySelector('.sensor-name span');
      
      if (nameElement && nameElement.textContent.trim() === sensorName) {
        const valueElement = item.querySelector('.sensor-value .value');
        const progressBar = item.querySelector('.progress-value');
        
        if (valueElement) {
          // Update the value text
          valueElement.textContent = value;
        }
        
        if (progressBar) {
          // Calculate percentage within the range
          const percentage = ((parseFloat(value) - range.min) / (range.max - range.min)) * 100;
          
          // Update progress bar
          progressBar.style.width = `${percentage}%`;
          
          // Update colors based on value (for temperature and pressure)
          if (sensorName === 'Temperature') {
            progressBar.className = 'progress-value temp';
            if (parseFloat(value) > 30) {
              progressBar.style.backgroundColor = '#e53935'; // hot
            } else if (parseFloat(value) < 20) {
              progressBar.style.backgroundColor = '#2196F3'; // cold
            } else {
              progressBar.style.backgroundColor = '#4CAF50'; // normal
            }
          } else if (sensorName === 'Pressure') {
            progressBar.className = 'progress-value pressure';
            if (parseFloat(value) > 103) {
              progressBar.style.backgroundColor = '#e53935'; // high
            } else if (parseFloat(value) < 98) {
              progressBar.style.backgroundColor = '#FFC107'; // low
            } else {
              progressBar.style.backgroundColor = '#4CAF50'; // normal
            }
          }
        }
      }
    });
  }
  
  // Call this function from the browser console to update component statuses manually
  // Example: manuallyUpdateComponents('Flow Cell Holes', 'Detected')
  function manuallyUpdateComponents(component, status) {
    if (window.setComponentStatus) {
      window.setComponentStatus(component, status);
    } else {
      console.error('Component status update function not available');
    }
  }