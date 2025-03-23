/**
 * Settings page JavaScript for FuelCell Monitor
 * Handles settings navigation, form controls, and saving preferences
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
    
    // Store original form values to check for changes
    const originalValues = {};
    
    // Cache all form elements for change detection
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        const id = element.id || element.name;
        if (id) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                originalValues[id] = element.checked;
            } else {
                originalValues[id] = element.value;
            }
        }
    });
    
    // Settings navigation
    const navButtons = document.querySelectorAll('.settings-nav-item');
    const settingsSections = document.querySelectorAll('.settings-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Check if there are unsaved changes before switching
            if (hasUnsavedChanges() && !confirm('You have unsaved changes. Continue without saving?')) {
                return;
            }
            
            // Remove active class from all buttons and sections
            navButtons.forEach(btn => btn.classList.remove('active'));
            settingsSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Range sliders
    const rangeSliders = document.querySelectorAll('.range-slider');
    
    rangeSliders.forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        
        // Set initial value display
        valueDisplay.textContent = `${slider.value}%`;
        
        // Update value display on input
        slider.addEventListener('input', function() {
            valueDisplay.textContent = `${slider.value}%`;
        });
    });
    
    // Function to check for unsaved changes
    function hasUnsavedChanges() {
        let changed = false;
        
        formElements.forEach(element => {
            const id = element.id || element.name;
            if (id) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    if (originalValues[id] !== element.checked) {
                        changed = true;
                    }
                } else {
                    if (originalValues[id] !== element.value) {
                        changed = true;
                    }
                }
            }
        });
        
        return changed;
    }
    
    // Function to update original values after saving
    function updateOriginalValues() {
        formElements.forEach(element => {
            const id = element.id || element.name;
            if (id) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    originalValues[id] = element.checked;
                } else {
                    originalValues[id] = element.value;
                }
            }
        });
    }
    
    // Theme switcher
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                // In a real implementation, this would apply the theme
                console.log(`Switching to ${this.id} theme`);
                
                // For demonstration purposes, just log the change
                if (this.id === 'dark') {
                    console.log('Applied dark theme');
                } else if (this.id === 'light') {
                    console.log('Applied light theme');
                } else {
                    console.log('Applied system theme');
                }
            }
        });
    });
    
    // Detection parameter sliders
    function setupDetectionSliders() {
        const sliders = {
            contrastSlider: {
                defaultValue: 50,
                unit: '%'
            },
            brightnessSlider: {
                defaultValue: 50,
                unit: '%'
            },
            flapThreshold: {
                defaultValue: 60,
                unit: '%'
            },
            overflowThreshold: {
                defaultValue: 20,
                unit: '%'
            },
            circleThreshold: {
                defaultValue: 75,
                unit: '%'
            }
        };
        
        // Set up each slider
        Object.keys(sliders).forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                const config = sliders[sliderId];
                
                // Set default value if not already set
                if (slider.value === '') {
                    slider.value = config.defaultValue;
                }
                
                // Find the value display element
                const valueDisplay = slider.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${slider.value}${config.unit}`;
                    
                    // Update on input
                    slider.addEventListener('input', function() {
                        valueDisplay.textContent = `${slider.value}${config.unit}`;
                    });
                }
            }
        });
    }
    
    // Call setup function
    setupDetectionSliders();
    
    // Toggle switches
    const toggles = document.querySelectorAll('.toggle input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const label = this.closest('.toggle-group').querySelector('.toggle-label').textContent;
            console.log(`${label} ${this.checked ? 'enabled' : 'disabled'}`);
        });
    });
    
    // Save button
    document.querySelector('.save-button').addEventListener('click', function() {
        // Validate form
        if (!validateSettings()) {
            return;
        }
        
        // Show saving indicator
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        this.disabled = true;
        
        // Simulate API call to save settings
        setTimeout(() => {
            // In a real implementation, this would make an API call to save
            saveSettingsToServer();
            
            // Update original values to match current
            updateOriginalValues();
            
            // Reset button
            this.innerHTML = 'Save Changes';
            this.disabled = false;
            
            // Show success message
            showMessage('Settings saved successfully', 'success');
        }, 1500);
    });
    
    // Cancel button
    document.querySelector('.cancel-button').addEventListener('click', function() {
        if (hasUnsavedChanges()) {
            if (confirm('Discard all changes?')) {
                resetFormToOriginalValues();
            }
        } else {
            showMessage('No changes to discard', 'info');
        }
    });
    
    // Form validation
    function validateSettings() {
        // Get system name
        const systemName = document.getElementById('systemName').value.trim();
        if (systemName === '') {
            showMessage('System name cannot be empty', 'error');
            return false;
        }
        
        // Additional validation could be added here
        
        return true;
    }
    
    // Reset form to original values
    function resetFormToOriginalValues() {
        formElements.forEach(element => {
            const id = element.id || element.name;
            if (id && originalValues[id] !== undefined) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = originalValues[id];
                } else {
                    element.value = originalValues[id];
                }
                
                // Trigger change event for sliders
                if (element.classList.contains('range-slider')) {
                    const event = new Event('input');
                    element.dispatchEvent(event);
                }
            }
        });
        
        showMessage('Changes discarded', 'info');
    }
    
    // Simulate saving settings to server
    function saveSettingsToServer() {
        console.log('Saving settings to server...');
        
        // Collect all settings values
        const settings = {};
        
        formElements.forEach(element => {
            const id = element.id || element.name;
            if (id) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    if (element.checked) {
                        settings[id] = element.checked;
                    }
                } else {
                    settings[id] = element.value;
                }
            }
        });
        
        console.log('Settings to save:', settings);
        
        // In a real implementation, this would send the settings to the server
    }
    
    // Show message function
    function showMessage(text, type = 'info') {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.settings-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const message = document.createElement('div');
        message.className = `settings-message ${type}`;
        message.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </div>
            <div class="message-text">${text}</div>
            <button class="message-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to the DOM
        document.body.appendChild(message);
        
        // Add close button handler
        message.querySelector('.message-close').addEventListener('click', function() {
            message.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
    
    // Add unload event to warn about unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges()) {
            // Standard message for most browsers
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            e.returnValue = message; // Standard for most browsers
            return message; // For older browsers
        }
    });
    
    // Add styles for the message notification
    const style = document.createElement('style');
    style.textContent = `
        .settings-message {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            padding: 12px 16px;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        
        .settings-message.success {
            border-left: 4px solid #16a34a;
        }
        
        .settings-message.error {
            border-left: 4px solid #dc2626;
        }
        
        .settings-message.info {
            border-left: 4px solid #3b82f6;
        }
        
        .message-icon {
            margin-right: 12px;
            font-size: 20px;
        }
        
        .settings-message.success .message-icon {
            color: #16a34a;
        }
        
        .settings-message.error .message-icon {
            color: #dc2626;
        }
        
        .settings-message.info .message-icon {
            color: #3b82f6;
        }
        
        .message-text {
            flex: 1;
        }
        
        .message-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
        }
        
        .message-close:hover {
            color: #111827;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});