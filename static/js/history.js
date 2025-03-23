/**
 * History page JavaScript for FuelCell Monitor
 * Handles event log display, filtering, and pagination
 */

document.addEventListener('DOMContentLoaded', function() {
  // Update the time display
  function updateTime() {
      const now = new Date();
      document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
      });
  }
  
  // Update time immediately and then every second
  updateTime();
  setInterval(updateTime, 1000);
  
  // Add data-label attributes for responsive design
  const timelineRows = document.querySelectorAll('.timeline-row');
  
  timelineRows.forEach(row => {
      const cols = row.querySelectorAll('.timeline-col');
      cols[0].setAttribute('data-label', 'Timestamp');
      cols[1].setAttribute('data-label', 'Event Type');
      cols[2].setAttribute('data-label', 'Component');
      cols[3].setAttribute('data-label', 'Description');
      cols[4].setAttribute('data-label', 'Status');
      cols[5].setAttribute('data-label', 'Actions');
  });
  
  // Set up search functionality
  const searchInput = document.querySelector('.search-input');
  searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      
      timelineRows.forEach(row => {
          const text = row.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
              row.style.display = '';
          } else {
              row.style.display = 'none';
          }
      });
  });
  
  // Initialize date picker with current date
  const dateRangeInput = document.getElementById('dateRange');
  if (dateRangeInput) {
      const today = new Date().toISOString().split('T')[0];
      dateRangeInput.value = today;
  }
  
  // Function to fetch event history data
  function fetchHistoryData(filters) {
      console.log('Fetching history data with filters:', filters);
      
      // In a real implementation, this would make an API call to get data
      // Then update the timeline with the fetched events
      
      // Show loading state
      const timelineBody = document.querySelector('.timeline-body');
      timelineBody.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading events...</div>';
      
      // Simulate API delay
      setTimeout(() => {
          // In a real implementation, this would parse the response and build the timeline
          generateMockEventData(filters);
      }, 1000);
  }
  
  // Generate mock event data for demonstration
  function generateMockEventData(filters) {
      const timelineBody = document.querySelector('.timeline-body');
      timelineBody.innerHTML = ''; // Clear existing content
      
      // Mock event types
      const eventTypes = ['Error', 'Warning', 'Status', 'Success', 'Maintenance'];
      const components = ['Fuel Cell Holes', 'Pipette', 'Flaps', 'Overflow', 'System'];
      const statuses = ['FAIL', 'WARNING', 'INFO', 'PASS', 'COMPLETE'];
      const descriptions = [
          'Fuel cell holes not detected during processing',
          'Flaps detected in closed position',
          'Processing started for batch',
          'Batch completed successfully',
          'Calibration check performed',
          'Temperature exceeded normal range',
          'Overflow detected in processing area',
          'Pressure dropped below minimum threshold',
          'Maintenance required on pipette assembly',
          'System restarted automatically'
      ];
      
      // Filter events by type if specified
      let filteredTypes = eventTypes;
      if (filters.eventType !== 'all') {
          // Map filter value to display text
          const typeMap = {
              'error': 'Error',
              'warning': 'Warning',
              'status': 'Status',
              'success': 'Success',
              'maintenance': 'Maintenance'
          };
          filteredTypes = [typeMap[filters.eventType]];
      }
      
      // Create mock events based on filters
      const mockEvents = [];
      const numEvents = 10; // Number of events to generate
      
      for (let i = 0; i < numEvents; i++) {
          // Use filtered event types
          const eventType = filteredTypes[Math.floor(Math.random() * filteredTypes.length)];
          const component = components[Math.floor(Math.random() * components.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const description = descriptions[Math.floor(Math.random() * descriptions.length)];
          
          // Mock date: today - random hours (0-48)
          const eventDate = new Date(filters.date);
          eventDate.setHours(eventDate.getHours() - Math.floor(Math.random() * 48));
          
          mockEvents.push({
              date: eventDate.toISOString().split('T')[0],
              time: eventDate.toTimeString().split(' ')[0],
              eventType: eventType,
              component: component,
              description: description,
              status: status
          });
      }
      
      // Sort events by date/time (most recent first)
      mockEvents.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
      });
      
      // Create event rows
      mockEvents.forEach(event => {
          // Create row element
          const row = document.createElement('div');
          row.className = 'timeline-row';
          
          // Timestamp column
          const timestampCol = document.createElement('div');
          timestampCol.className = 'timeline-col timestamp';
          timestampCol.setAttribute('data-label', 'Timestamp');
          timestampCol.innerHTML = `
              <div class="date">${event.date}</div>
              <div class="time">${event.time}</div>
          `;
          
          // Event type column
          const eventTypeCol = document.createElement('div');
          eventTypeCol.className = 'timeline-col event-type';
          eventTypeCol.setAttribute('data-label', 'Event Type');
          
          // Determine badge class based on event type
          let badgeClass = 'info';
          if (event.eventType === 'Error') badgeClass = 'error';
          else if (event.eventType === 'Warning') badgeClass = 'warning';
          else if (event.eventType === 'Success') badgeClass = 'success';
          else if (event.eventType === 'Maintenance') badgeClass = 'maintenance';
          
          eventTypeCol.innerHTML = `
              <span class="event-badge ${badgeClass}">${event.eventType}</span>
          `;
          
          // Component column
          const componentCol = document.createElement('div');
          componentCol.className = 'timeline-col component';
          componentCol.setAttribute('data-label', 'Component');
          componentCol.textContent = event.component;
          
          // Description column
          const descriptionCol = document.createElement('div');
          descriptionCol.className = 'timeline-col description';
          descriptionCol.setAttribute('data-label', 'Description');
          descriptionCol.textContent = event.description;
          
          // Status column
          const statusCol = document.createElement('div');
          statusCol.className = 'timeline-col status';
          statusCol.setAttribute('data-label', 'Status');
          
          // Determine status badge class
          let statusClass = 'info';
          if (event.status === 'FAIL') statusClass = 'fail';
          else if (event.status === 'PASS' || event.status === 'COMPLETE') statusClass = 'pass';
          else if (event.status === 'WARNING') statusClass = 'warning';
          
          statusCol.innerHTML = `
              <span class="status-badge ${statusClass}">${event.status}</span>
          `;
          
          // Actions column
          const actionsCol = document.createElement('div');
          actionsCol.className = 'timeline-col actions';
          actionsCol.setAttribute('data-label', 'Actions');
          
          // Add appropriate action buttons
          let actionButtons = `
              <button class="action-button"><i class="fas fa-info-circle"></i></button>
          `;
          
          // Add camera button for visual events
          if (['Error', 'Warning', 'Success'].includes(event.eventType)) {
              actionButtons += `
                  <button class="action-button"><i class="fas fa-camera"></i></button>
              `;
          }
          
          // Add download button for completed events
          if (['Success', 'Maintenance'].includes(event.eventType)) {
              actionButtons += `
                  <button class="action-button"><i class="fas fa-file-download"></i></button>
              `;
          }
          
          actionsCol.innerHTML = actionButtons;
          
          // Add all columns to the row
          row.appendChild(timestampCol);
          row.appendChild(eventTypeCol);
          row.appendChild(componentCol);
          row.appendChild(descriptionCol);
          row.appendChild(statusCol);
          row.appendChild(actionsCol);
          
          // Add the row to the timeline
          timelineBody.appendChild(row);
      });
      
      // Set up action buttons in the newly created rows
      setupActionButtons();
  }
  
  // Set up action buttons
  function setupActionButtons() {
      document.querySelectorAll('.action-button').forEach(button => {
          button.addEventListener('click', function() {
              const action = this.querySelector('i').className;
              const row = this.closest('.timeline-row');
              const component = row.querySelector('.timeline-col.component').textContent;
              const timestamp = row.querySelector('.timeline-col.timestamp').textContent.trim().replace(/\s+/g, ' ');
              
              if (action.includes('info-circle')) {
                  console.log(`Showing details for ${component} at ${timestamp}`);
                  // In a real implementation, this would open a modal with details
                  alert(`Event Details for ${component}\nTime: ${timestamp}`);
              } else if (action.includes('camera')) {
                  console.log(`Showing image for ${component} at ${timestamp}`);
                  // In a real implementation, this would open a modal with the image
                  alert(`Image capture for ${component}\nTime: ${timestamp}`);
              } else if (action.includes('file-download')) {
                  console.log(`Downloading report for ${component} at ${timestamp}`);
                  // In a real implementation, this would download a report
                  alert(`Downloading report for ${component}\nTime: ${timestamp}`);
              }
          });
      });
  }
  
  // Set up filter button
  document.querySelector('.filter-button').addEventListener('click', function() {
      const eventType = document.getElementById('eventType').value;
      const dateRange = document.getElementById('dateRange').value;
      
      const filters = {
          eventType: eventType,
          date: dateRange
      };
      
      fetchHistoryData(filters);
  });
  
  // Set up export button
  document.querySelector('.export-button').addEventListener('click', function() {
      console.log('Exporting history data...');
      
      // Get current filters
      const eventType = document.getElementById('eventType').value;
      const dateRange = document.getElementById('dateRange').value;
      
      // In a real implementation, this would generate a CSV or PDF
      alert(`Exporting events:\nEvent Type: ${eventType}\nDate: ${dateRange}`);
  });
  
  // Set up pagination
  const paginationButtons = document.querySelectorAll('.pagination-button, .pagination-number');
  
  paginationButtons.forEach(button => {
      if (!button.classList.contains('disabled')) {
          button.addEventListener('click', function() {
              // Remove active class from all pagination numbers
              document.querySelectorAll('.pagination-number').forEach(num => {
                  num.classList.remove('active');
              });
              
              // If this is a number button, make it active
              if (this.classList.contains('pagination-number')) {
                  this.classList.add('active');
                  
                  // Get current filters and update with page number
                  const eventType = document.getElementById('eventType').value;
                  const dateRange = document.getElementById('dateRange').value;
                  
                  const filters = {
                      eventType: eventType,
                      date: dateRange,
                      page: this.textContent.trim()
                  };
                  
                  fetchHistoryData(filters);
              } else {
                  // This is a prev/next button
                  const currentPage = document.querySelector('.pagination-number.active');
                  let newPage;
                  
                  if (this.querySelector('i').classList.contains('fa-chevron-left')) {
                      // Previous page
                      newPage = currentPage.previousElementSibling;
                      while (newPage && !newPage.classList.contains('pagination-number')) {
                          newPage = newPage.previousElementSibling;
                      }
                  } else {
                      // Next page
                      newPage = currentPage.nextElementSibling;
                      while (newPage && !newPage.classList.contains('pagination-number')) {
                          newPage = newPage.nextElementSibling;
                      }
                  }
                  
                  if (newPage) {
                      newPage.click();
                  }
              }
          });
      }
  });
  
  // Initial data fetch with default filters
  const initialFilters = {
      eventType: 'all',
      date: new Date().toISOString().split('T')[0]
  };
  
  fetchHistoryData(initialFilters);
});