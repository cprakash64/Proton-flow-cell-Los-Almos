import serial
import time
from serial.tools import list_ports

def find_dobot_on_mac():
    """
    Find Dobot port on macOS and test connection
    """
    print("=== Dobot Port Finder for macOS ===\n")
    
    # Get all available ports
    ports = list(serial.tools.list_ports.comports())
    
    if not ports:
        print("No serial ports found! Check if your Dobot is connected.")
        return None
    
    print("Found the following ports:")
    for i, port in enumerate(ports):
        print(f"{i+1}. {port.device} - {port.description}")
    
    print("\nLooking for likely Dobot ports...")
    
    # List of candidates with reasons
    candidates = []
    
    # Check for USB modem ports (most likely on macOS)
    usb_modem_ports = [port for port in ports if "usbmodem" in port.device]
    if usb_modem_ports:
        for port in usb_modem_ports:
            candidates.append((port.device, "USB modem device (likely)"))
    
    # Check for ports with standard Dobot identifiers
    for port in ports:
        if any(id_str in port.description for id_str in ["USB-SERIAL", "Dobot", "CH340"]):
            candidates.append((port.device, "Matching description"))
    
    if not candidates:
        print("No obvious Dobot ports found.")
        print("We'll try all available ports:")
        for port in ports:
            candidates.append((port.device, "Testing all ports"))
    
    # Try to connect to each candidate
    successful_port = None
    
    print("\nTesting connection to candidate ports:")
    for port_name, reason in candidates:
        print(f"\nTrying {port_name} ({reason})...")
        
        try:
            # Try to open the serial port
            ser = serial.Serial(port_name, 115200, timeout=2)
            print(f"  ✓ Successfully opened port {port_name}")
            
            # Try to send Dobot header
            ser.write(bytes([0xAA, 0xAA]))
            time.sleep(0.5)
            
            if ser.in_waiting:
                response = ser.read(ser.in_waiting)
                print(f"  ✓ Received response: {response.hex()}")
                successful_port = port_name
            else:
                print("  ✓ Port opened but no response (may still be Dobot)")
                # If we haven't found a successful port yet, consider this one
                if successful_port is None:
                    successful_port = port_name
            
            ser.close()
            
        except Exception as e:
            print(f"  ✗ Error with {port_name}: {str(e)}")
    
    print("\n=== Results ===")
    if successful_port:
        print(f"Success! Try using this port: {successful_port}")
        print("\nIn your code, specify this port explicitly:")
        print(f"robot = DobotPipettingSystem(port='{successful_port}')")
        return successful_port
    else:
        print("Could not find a working Dobot port.")
        print("Please check your connections and try again.")
        print("If the robot is connected but not detected:")
        print("1. Unplug and replug the USB cable")
        print("2. Try a different USB port")
        print("3. Restart the Dobot")
        print("4. Check if you need to install drivers from the Dobot website")
        return None

if __name__ == "__main__":
    found_port = find_dobot_on_mac()
    
    if found_port:
        # Try to connect using pydobot
        try:
            from pydobot import Dobot
            print(f"\nAttempting to connect with pydobot on {found_port}...")
            device = Dobot(port=found_port, verbose=True)
            x, y, z, r = device.pose()
            print(f"Connection successful! Current position: x={x:.2f}, y={y:.2f}, z={z:.2f}, r={r:.2f}")
            device.close()
        except ImportError:
            print("\nPydobot not installed. To test with pydobot, install it with:")
            print("pip install pydobot")
        except Exception as e:
            print(f"\nFailed to connect with pydobot: {e}")