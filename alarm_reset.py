import time
import struct
import serial
from serial.tools import list_ports

class DobotAlarmReset:
    def __init__(self, port='/dev/cu.usbmodem11301', baudrate=115200):
        """Initialize connection to Dobot for alarm reset"""
        self.port = port
        self.baudrate = baudrate
        self.ser = None
        self.sequence = 0
        
    def connect(self):
        """Connect to the Dobot"""
        try:
            print(f"Connecting to {self.port}...")
            self.ser = serial.Serial(self.port, self.baudrate, timeout=5)
            time.sleep(2)  # Give time for connection to stabilize
            print(f"Connected to {self.port}")
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False
    
    def _calculate_checksum(self, payload):
        """Calculate checksum for command"""
        checksum = 0
        for byte in payload:
            checksum += byte
        return checksum & 0xFF
    
    def send_command(self, cmd, payload=None):
        """Send a command to the Dobot"""
        if not self.ser or not self.ser.is_open:
            print("Serial port not open")
            return None
            
        if payload is None:
            payload = []
        
        # Build message: header + length + cmd + sequence + payload
        message = bytearray([0xAA, 0xAA])
        length = 2 + len(payload)  # cmd(1) + sequence(1) + payload
        message.extend([length, cmd, self.sequence])
        message.extend(payload)
        
        # Add checksum and end
        checksum = self._calculate_checksum(message[2:])
        message.append(checksum)
        message.extend([0x0D, 0x0A])
        
        # Send and increment sequence
        self.ser.write(message)
        response = self.read_response()
        self.sequence = (self.sequence + 1) % 256
        time.sleep(0.1)
        
        return response
    
    def read_response(self):
        """Read response from Dobot"""
        try:
            # Read header (0xAA, 0xAA)
            header = self.ser.read(2)
            if header != b'\xAA\xAA':
                print(f"Invalid header: {header.hex() if header else 'None'}")
                return None
            
            # Read length byte
            length_byte = self.ser.read(1)
            if not length_byte:
                print("Failed to read length byte")
                return None
            
            length = ord(length_byte)
            
            # Read remaining message
            message = self.ser.read(length + 3)  # +3 for checksum and end bytes
            return message
        except Exception as e:
            print(f"Error reading response: {e}")
            return None
    
    def get_alarm_state(self):
        """Get the current alarm state"""
        print("Checking alarm state...")
        
        # Command 0x80 is for getting alarm state
        response = self.send_command(0x81)
        
        if response:
            print(f"Alarm response: {response.hex()}")
            # Parsing logic would go here, but needs specific knowledge of response format
            return True
        else:
            print("Failed to get alarm state")
            return False
    
    def clear_alarms(self):
        """Clear all alarms"""
        print("Clearing all alarms...")
        
        # Command 0x8A is commonly used for clearing alarms
        response = self.send_command(0x8A)
        
        if response:
            print("Alarm clear command sent successfully")
            print(f"Response: {response.hex()}")
            return True
        else:
            print("Failed to send alarm clear command")
            return False
    
    def reboot_robot(self):
        """Attempt to reboot the robot"""
        print("Sending reboot command...")
        
        # Command 0xCF is used for rebooting in many Dobot models
        response = self.send_command(0xCF)
        
        if response:
            print("Reboot command sent successfully")
            print(f"Response: {response.hex()}")
            return True
        else:
            print("Failed to send reboot command")
            return False

    def disconnect(self):
        """Close the connection"""
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("Connection closed")


if __name__ == "__main__":
    # Create alarm reset object
    reset_tool = DobotAlarmReset()
    
    try:
        # Connect to the Dobot
        if not reset_tool.connect():
            print("Could not connect to Dobot. Please check connections.")
            exit(1)
        
        # Check alarm state
        reset_tool.get_alarm_state()
        
        # Try to clear alarms
        print("\nAttempting to clear alarms...")
        reset_tool.clear_alarms()
        
        # Wait for alarm clear to take effect
        print("Waiting for alarm clear to process...")
        time.sleep(5)
        
        # Check if alarms are cleared
        reset_tool.get_alarm_state()
        
        print("\nAlarm reset procedure completed.")
        print("If the red light is still on, please:")
        print("1. Power cycle the robot (turn off, wait 30 seconds, turn on)")
        print("2. Use Dobot Studio to clear alarms")
        print("3. Check if emergency stop is released")
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # Always disconnect
        reset_tool.disconnect()