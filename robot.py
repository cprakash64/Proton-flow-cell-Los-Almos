import time
from pydobot import Dobot
import serial.tools.list_ports

class DobotPipettingSystem:
    def __init__(self, port='/dev/cu.usbmodem11301', verbose=True):
        """
        Initialize the Dobot pipetting system with fixed pose handling
        
        Args:
            port (str): Serial port for Dobot connection
            verbose (bool): Enable verbose output
        """
        self.device = None
        self.connected = False
        self.verbose = verbose
        
        # Connect to the robot
        self._connect(port)
    
    def _connect(self, port):
        """Connect to the Dobot with fixed pose handling"""
        if self.verbose:
            print(f"Attempting to connect to Dobot on {port}...")
        
        try:
            self.device = Dobot(port=port, verbose=self.verbose)
            self.connected = True
            
            # Test if we can get the position
            try:
                self._get_position()
                if self.verbose:
                    print(f"Connected to Dobot on {port}")
            except Exception as e:
                print(f"Connected but couldn't get position: {e}")
                
        except Exception as e:
            print(f"Failed to connect to Dobot: {e}")
    
    def _get_position(self):
        """
        Get current position with fixed handling for different Dobot models
        
        Returns:
            tuple: (x, y, z, r) position
        """
        try:
            # Try normal pose first
            pose = self.device.pose()
            return pose[0:4]  # Return first 4 values regardless
        except ValueError as e:
            # If "too many values to unpack" error, use _get_pose
            if "too many values to unpack" in str(e):
                raw_pose = self.device._get_pose()
                return raw_pose[0:4]  # First 4 values
            else:
                raise e
    
    def home(self):
        """Home the robot"""
        if not self.connected:
            print("Robot not connected")
            return
        
        if self.verbose:
            print("Homing robot...")
        self.device.home()
    
    def move_to(self, x, y, z, r=0, jump=True, wait=True):
        """
        Move the robot to specified coordinates
        
        Args:
            x, y, z, r: Coordinates and rotation angle
            jump (bool): If True, use jump mode (move up, across, then down)
            wait (bool): If True, wait for movement to complete
        """
        if not self.connected:
            print("Robot not connected")
            return
        
        if self.verbose:
            print(f"Moving to: x={x:.2f}, y={y:.2f}, z={z:.2f}, r={r:.2f}")
        
        # Use the appropriate move mode
        if jump:
            self.device.move_to(x, y, z, r, wait=wait)
        else:
            self.device.move_to(x, y, z, r, wait=wait, mode=1)  # Mode 1 = MOVJ_XYZ
    
    def control_suction(self, enable):
        """
        Control the suction cup
        
        Args:
            enable (bool): True to enable suction, False to disable
        """
        if not self.connected:
            print("Robot not connected")
            return
        
        if self.verbose:
            print(f"{'Enabling' if enable else 'Disabling'} suction")
        
        if enable:
            self.device.suck(True)
        else:
            self.device.suck(False)
    
    def control_air_pump(self, enable):
        """
        Control the air pump for pipetting
        
        Args:
            enable (bool): True to enable pump, False to disable
        """
        if not self.connected:
            print("Robot not connected")
            return
        
        if self.verbose:
            print(f"{'Enabling' if enable else 'Disabling'} pump")
        
        if enable:
            self.device.grip(True)  # Using grip function to control air pump
        else:
            self.device.grip(False)
    
    def pipette_pickup(self, position, safe_z=80, z_offset=0):
        """
        Move to position and perform liquid pickup
        
        Args:
            position (list): [x, y, z] coordinates for pickup
            safe_z (float): Safe Z height for travel
            z_offset (float): Additional Z offset for fine adjustment
        """
        if not self.connected:
            print("Robot not connected")
            return
        
        if self.verbose:
            print(f"Performing liquid pickup at {position}")
        
        # Get current position for r value
        current_pos = self._get_position()
        r = current_pos[3]
        
        # Move to position at safe height
        self.move_to(position[0], position[1], safe_z, r)
        
        # Move down to pickup liquid
        self.move_to(position[0], position[1], position[2] + z_offset, r, jump=False)
        
        # Activate pump to draw liquid
        self.control_air_pump(True)
        time.sleep(1.5)  # Time to draw liquid
        
        # Move back up to safe height
        self.move_to(position[0], position[1], safe_z, r)
    
    def pipette_dispense(self, position, safe_z=80, z_offset=0):
        """
        Move to position and perform liquid dispensing
        
        Args:
            position (list): [x, y, z] coordinates for dispensing
            safe_z (float): Safe Z height for travel
            z_offset (float): Additional Z offset for fine adjustment
        """
        if not self.connected:
            print("Robot not connected")
            return
        
        if self.verbose:
            print(f"Dispensing liquid at {position}")
        
        # Get current position for r value
        current_pos = self._get_position()
        r = current_pos[3]
        
        # Move to position at safe height
        self.move_to(position[0], position[1], safe_z, r)
        
        # Move down to dispense liquid
        self.move_to(position[0], position[1], position[2] + z_offset, r, jump=False)
        
        # Deactivate pump to dispense liquid
        self.control_air_pump(False)
        time.sleep(1.5)  # Time to dispense liquid
        
        # Move back up to safe height
        self.move_to(position[0], position[1], safe_z, r)
    
    def complete_pipetting_operation(self, source_pos, target_pos, safe_z=80):
        """
        Perform a complete pipetting operation from source to target
        
        Args:
            source_pos (list): [x, y, z] coordinates for pickup
            target_pos (list): [x, y, z] coordinates for dispensing
            safe_z (float): Safe Z height for travel
        """
        if self.verbose:
            print(f"Starting pipetting operation: {source_pos} -> {target_pos}")
        
        # Pickup liquid
        self.pipette_pickup(source_pos, safe_z)
        
        # Dispense liquid
        self.pipette_dispense(target_pos, safe_z)
        
        if self.verbose:
            print("Pipetting operation completed")
    
    def close(self):
        """Close connection to robot"""
        if self.connected:
            self.device.close()
            self.connected = False
            if self.verbose:
                print("Disconnected from Dobot")


# Example usage for fuel cell application
if __name__ == "__main__":
    # Initialize robot with macOS port
    pipetting_system = DobotPipettingSystem(port='/dev/cu.usbmodem11301')
    
    # Check if connection successful
    if not pipetting_system.connected:
        print("Failed to connect to Dobot. Exiting.")
        exit()
    
    try:
        # Get current position to use as reference
        current_pos = pipetting_system._get_position()
        print(f"Current position: x={current_pos[0]:.2f}, y={current_pos[1]:.2f}, z={current_pos[2]:.2f}, r={current_pos[3]:.2f}")
        
        # Use current position as base and define relative positions
        base_x, base_y = current_pos[0], current_pos[1]
        safe_z = current_pos[2] + 40  # 40mm above current height
        
        # Define positions based on current location
        # These need to be adjusted for your specific setup
        reagent_source = [base_x + 50, base_y, current_pos[2] - 20]
        solution_source = [base_x + 80, base_y, current_pos[2] - 20]
        
        # Target positions (fuel cell holes)
        hole1_target = [base_x - 30, base_y + 50, current_pos[2] - 20]
        hole2_target = [base_x - 30, base_y + 80, current_pos[2] - 20]
        
        # Prompt user before starting movement
        input("\nRobot will now move to test positions. Press Enter to continue or Ctrl+C to cancel...")
        
        # Home the robot first (optional)
        # pipetting_system.home()
        # time.sleep(3)  # Wait for homing to complete
        
        # Perform pipetting operations
        print("\nDispensing reagent into hole 1...")
        pipetting_system.complete_pipetting_operation(reagent_source, hole1_target, safe_z)
        
        print("\nDispensing solution into hole 2...")
        pipetting_system.complete_pipetting_operation(solution_source, hole2_target, safe_z)
        
        print("\nAll operations completed successfully!")
        
    except Exception as e:
        print(f"Error during operation: {e}")
    
    finally:
        # Always close the connection properly
        pipetting_system.close()