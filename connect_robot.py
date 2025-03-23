import time
import serial
from serial.tools import list_ports

# Find the Dobot port
def find_dobot_port():
    for port in list_ports.comports():
        if 'usbmodem' in port.device:
            return port.device
    return None

# Main test function
def test_dobot():
    # Find the port
    port = find_dobot_port()
    if not port:
        print("ERROR: Could not find a USB modem port that looks like a Dobot")
        print("Available ports:")
        for p in list_ports.comports():
            print(f"  {p.device}")
        return False
    
    print(f"Found potential Dobot port: {port}")
    
    try:
        # Open the serial connection
        print(f"Opening port {port}...")
        ser = serial.Serial(port, 115200, timeout=2)
        print("Port opened successfully!")
        
        # Clear any pending data
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        
        # Simple version request command
        # Header (0xAA, 0xAA) + Length (0x02) + Command ID (0x01) + Sequence (0x00) + Checksum (0x03) + End (0x0D, 0x0A)
        command = bytearray([0xAA, 0xAA, 0x02, 0x01, 0x00, 0x03, 0x0D, 0x0A])
        
        # Send the command
        print(f"Sending version request command: {command.hex()}")
        ser.write(command)
        
        # Wait for response
        print("Waiting for response...")
        time.sleep(1)
        
        # Check if there's a response
        if ser.in_waiting > 0:
            # Read the response
            response = ser.read(ser.in_waiting)
            print(f"SUCCESS! Received response: {response.hex()}")
            result = True
        else:
            print("No response received from the robot.")
            print("This could indicate:")
            print("1. The robot is powered off")
            print("2. The robot's emergency stop is engaged")
            print("3. The robot is in an error state")
            print("4. There's a driver or communication issue")
            result = False
        
        # Close the connection
        ser.close()
        print("Port closed")
        
        return result
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

# Run the test
if __name__ == "__main__":
    print("=== SIMPLE DOBOT COMMUNICATION TEST ===")
    result = test_dobot()
    
    if result:
        print("\nTEST PASSED: Successfully communicated with the Dobot!")
        print("You can now proceed with your pipetting application.")
    else:
        print("\nTEST FAILED: Could not communicate with the Dobot.")
        print("Troubleshooting steps:")
        print("1. Make sure the robot is powered on")
        print("2. Check that the emergency stop button is released (twisted clockwise)")
        print("3. Check that the USB cable is securely connected")
        print("4. Try using Dobot Studio to test if the robot works with official software")