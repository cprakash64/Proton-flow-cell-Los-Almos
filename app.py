import cv2
import numpy as np
import threading
import time
import random
from flask import Flask, Response, jsonify, render_template

app = Flask(__name__)

# Global variables for the processed frame and detection status
output_frame = None
detection_status = {
    "fuel_cell_holes": "unknown",
    "pipette": "unknown",
    "flaps": "unknown",
    "overflow": "unknown",
    "overall": "unknown",
    "temperature": "unknown",
    "pressure": "unknown",
    "motion": "unknown",
    "ultrasonic": "unknown"
}
lock = threading.Lock()

# ----------------- Sensor Simulation (Replace with Real Sensors) -----------------
def read_temperature():
    return round(random.uniform(20, 30), 2)

def read_pressure():
    return round(random.uniform(100, 120), 2)

def read_motion():
    return random.choice(["Detected", "Not Detected"])

def read_ultrasonic():
    return round(random.uniform(5, 15), 2)

# ----------------- Vision Processing -----------------
def detect_fuel_cell_holes(frame):
    """
    Detect if the fuel cell holes are open using contour detection
    and shape analysis rather than simple circle detection.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply threshold to create binary image
    _, thresh = cv2.threshold(blurred, 80, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours by size and circularity to find holes
    holes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 100 and area < 5000:  # Filter by size
            perimeter = cv2.arcLength(cnt, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                if circularity > 0.7:  # Circle has circularity close to 1
                    # Get bounding rectangle to find center and "radius"
                    x, y, w, h = cv2.boundingRect(cnt)
                    center = (int(x + w/2), int(y + h/2))
                    radius = int((w + h) / 4)  # Approximate radius
                    holes.append((center, radius))
    
    return holes

def detect_syringe(frame):
    """
    Detect a syringe/pipette like the one in the reference image (clear with measurement markings).
    Specifically looks for the characteristics of a medical syringe with plunger.
    """
    if frame is None:
        return []
        
    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive thresholding to highlight edges and text markings
    # This will help detect the measurement lines on the syringe
    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11,
        2
    )
    
    # Apply morphological operations to enhance the structure
    kernel = np.ones((3, 3), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    # Find contours
    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours to find potential syringes
    syringe_contours = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 500:  # Ignore small contours
            continue
            
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Check aspect ratio - syringes are elongated
        aspect_ratio = float(h) / w if w > 0 else 0
        if aspect_ratio < 2:  # Looking for tall, narrow objects
            continue
            
        # Check if contour is mostly straight lines (like a syringe body)
        # Approximate the contour
        epsilon = 0.04 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        
        # A syringe shape typically has 4-8 vertices when approximated
        if len(approx) < 4 or len(approx) > 12:
            continue
            
        # Additional check: Look for parallel lines that would be the syringe barrel
        # Convert to grayscale and binary
        roi = frame[y:y+h, x:x+w]
        if roi.size == 0:
            continue
            
        roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        _, roi_bin = cv2.threshold(roi_gray, 100, 255, cv2.THRESH_BINARY)
        
        # Apply edge detection
        edges = cv2.Canny(roi_bin, 50, 150)
        
        # Apply Hough transform to detect lines
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=h/3, maxLineGap=20)
        
        if lines is None or len(lines) < 2:
            continue
            
        # Check for text markings (like measurements)
        # Count small contours that could be measurement lines
        roi_thresh = cv2.adaptiveThreshold(
            roi_gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11,
            2
        )
        
        marking_contours, _ = cv2.findContours(roi_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        small_markings = [c for c in marking_contours if 5 < cv2.contourArea(c) < 100]
        
        # Syringes typically have multiple small marking lines
        if len(small_markings) < 3:
            continue
        
        # If all checks pass, this is likely a syringe
        syringe_contours.append({
            'contour': cnt,
            'rect': (x, y, w, h),
            'confidence': min(100, area / 100)  # Basic confidence metric
        })
    
    # Sort by confidence
    syringe_contours.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Return contours of detected syringes (highest confidence first)
    return [s['contour'] for s in syringe_contours]

def process_frame(frame):
    """
    Process the frame to:
      - Detect fuel cell holes (using circle detection)
      - Detect pipette/syringe specifically like in the reference image
      - Check flap state
      - Check for liquid overflow
    Returns the processed frame and remarks.
    """
    if frame is None:
        return None, []
    
    output = frame.copy()
    remarks = []
    
    # --- 1. Fuel Cell Hole Detection ---
    holes = detect_fuel_cell_holes(frame)
    if len(holes) > 0:
        # Draw detected holes
        for (center, radius) in holes:
            cv2.circle(output, center, radius, (0, 255, 0), 2)
            cv2.circle(output, center, 2, (0, 0, 255), 2)
        
        remarks.append(f"Fuel cell holes detected: {len(holes)}")
        detection_status["fuel_cell_holes"] = "detected"
    else:
        remarks.append("Fuel cell holes NOT detected")
        detection_status["fuel_cell_holes"] = "not detected"
    
    # --- 2. Syringe/Pipette Detection ---
    syringe_contours = detect_syringe(frame)
    if len(syringe_contours) > 0:
        # Draw detected syringe outline
        cv2.drawContours(output, syringe_contours, -1, (255, 0, 0), 2)
        
        # Get bounding rectangle for the largest contour
        if len(syringe_contours) > 0:
            largest_contour = max(syringe_contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest_contour)
            cv2.rectangle(output, (x, y), (x+w, y+h), (0, 255, 255), 2)
            cv2.putText(output, "Pipette", (x, y-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        remarks.append("Pipette detected")
        detection_status["pipette"] = "detected"
    else:
        remarks.append("Pipette NOT detected")
        detection_status["pipette"] = "not detected"
    
    # --- 3. Flap State Detection ---
    flap_info = detect_flaps(frame)
    
    # Draw ROIs for priming and spotON ports
    x1, y1, x2, y2 = flap_info["priming_roi"]
    cv2.rectangle(output, (x1, y1), (x2, y2), (0, 0, 255), 2)
    cv2.putText(output, f"Priming: {'Closed' if flap_info['priming_closed'] else 'Open'}", 
                (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    x1, y1, x2, y2 = flap_info["spoton_roi"]
    cv2.rectangle(output, (x1, y1), (x2, y2), (0, 0, 255), 2)
    cv2.putText(output, f"SpotON: {'Closed' if flap_info['spoton_closed'] else 'Open'}", 
                (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    # Update overall flap status
    flap_status = "Closed" if flap_info["flaps_closed"] else "Open"
    remarks.append(f"Flaps are {flap_status}")
    detection_status["flaps"] = flap_status
    
    # --- 4. Liquid Overflow Detection ---
    overflow_info = detect_overflow(frame)
    
    # Draw overflow ROI
    x1, y1, x2, y2 = overflow_info["overflow_roi"]
    cv2.rectangle(output, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    # Update overflow status
    overflow_status = "Overflowing" if overflow_info["is_overflowing"] else "Normal"
    cv2.putText(output, f"Overflow: {overflow_status}", (x1, y1-10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    remarks.append(f"Liquid overflow: {overflow_status}")
    detection_status["overflow"] = overflow_status
    
    # --- 5. Overall Evaluation ---
    # Passing criteria: 
    # - Flaps are closed (as shown in the reference image)
    # - No overflow
    # - Fuel cell holes detected (when open)
    # - Pipette detected (when present)
    if (flap_status == "Closed" and 
        overflow_status == "Normal" and 
        detection_status["pipette"] == "detected" and 
        detection_status["fuel_cell_holes"] == "detected"):
        overall = "PASS"
    else:
        overall = "FAIL"
    
    cv2.putText(output, f"Overall: {overall}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0,
                (0, 255, 0) if overall == "PASS" else (0, 0, 255), 2)
    
    remarks.append(f"Overall: {overall}")
    detection_status["overall"] = overall
    
    return output, remarks

def detect_flaps(frame):
    """
    Detect if the Priming port cover and SpotON port cover are closed or open
    based on the image of the fuel cell provided.
    """
    # Define regions of interest for the Priming port and SpotON port
    # These coordinates need to be adjusted based on your camera setup
    h, w = frame.shape[:2]
    
    # Approximate regions based on fuel cell image
    # Left third is roughly where the Priming port is
    priming_roi = frame[int(h*0.3):int(h*0.7), int(w*0.2):int(w*0.4)]
    
    # Right third is roughly where the SpotON port is
    spoton_roi = frame[int(h*0.3):int(h*0.7), int(w*0.6):int(w*0.8)]
    
    # Convert ROIs to grayscale
    priming_gray = cv2.cvtColor(priming_roi, cv2.COLOR_BGR2GRAY)
    spoton_gray = cv2.cvtColor(spoton_roi, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding
    _, priming_thresh = cv2.threshold(priming_gray, 80, 255, cv2.THRESH_BINARY)
    _, spoton_thresh = cv2.threshold(spoton_gray, 80, 255, cv2.THRESH_BINARY)
    
    # Calculate the percentage of white pixels (indicating an open port)
    priming_white_percent = (cv2.countNonZero(priming_thresh) / (priming_roi.shape[0] * priming_roi.shape[1])) * 100
    spoton_white_percent = (cv2.countNonZero(spoton_thresh) / (spoton_roi.shape[0] * spoton_roi.shape[1])) * 100
    
    # Check if ports are closed based on the percentage of white pixels
    # When closed, the dark covers will result in fewer white pixels
    priming_closed = priming_white_percent < 40
    spoton_closed = spoton_white_percent < 40
    
    # Overall flap state - both need to be in same state for simplicity
    flaps_closed = priming_closed and spoton_closed
    
    return {
        "flaps_closed": flaps_closed,
        "priming_closed": priming_closed,
        "spoton_closed": spoton_closed,
        "priming_roi": (int(w*0.2), int(h*0.3), int(w*0.4), int(h*0.7)),
        "spoton_roi": (int(w*0.6), int(h*0.3), int(w*0.8), int(h*0.7))
    }

def detect_overflow(frame):
    """
    Detect liquid overflow using color detection for liquids.
    This looks for any liquid outside the expected regions.
    """
    # Define region where overflow would be visible
    h, w = frame.shape[:2]
    overflow_roi = frame[int(h*0.5):int(h*0.9), int(w*0.1):int(w*0.9)]
    
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(overflow_roi, cv2.COLOR_BGR2HSV)
    
    # Detect blue-ish colors (adjust range based on your actual liquid color)
    lower_liquid = np.array([90, 50, 50])
    upper_liquid = np.array([130, 255, 255])
    mask = cv2.inRange(hsv, lower_liquid, upper_liquid)
    
    # Calculate percentage of liquid pixels
    liquid_pixels = cv2.countNonZero(mask)
    total_pixels = overflow_roi.shape[0] * overflow_roi.shape[1]
    liquid_percent = (liquid_pixels / total_pixels) * 100
    
    # Determine if overflow is present
    OVERFLOW_THRESHOLD = 5  # Adjust based on your conditions
    is_overflowing = liquid_percent > OVERFLOW_THRESHOLD
    
    return {
        "is_overflowing": is_overflowing,
        "liquid_percent": liquid_percent,
        "overflow_roi": (int(w*0.1), int(h*0.5), int(w*0.9), int(h*0.9))
    }

def process_frame(frame):
    """
    Process the frame to detect fuel cell components and status.
    Update to detect:
    - Fuel cell holes (open/closed)
    - Syringe/pipette presence
    - Flap state (closed/open) for both Priming and SpotON port covers
    - Liquid overflow
    """
    if frame is None:
        return None, []
    
    output = frame.copy()
    remarks = []
    
    # --- 1. Fuel Cell Hole Detection ---
    holes = detect_fuel_cell_holes(frame)
    if len(holes) > 0:
        # Draw detected holes
        for (center, radius) in holes:
            cv2.circle(output, center, radius, (0, 255, 0), 2)
            cv2.circle(output, center, 2, (0, 0, 255), 2)
        
        remarks.append(f"Fuel cell holes detected: {len(holes)}")
        detection_status["fuel_cell_holes"] = "detected"
    else:
        remarks.append("Fuel cell holes NOT detected")
        detection_status["fuel_cell_holes"] = "not detected"
    
    # --- 2. Syringe/Pipette Detection ---
    syringe_contours = detect_syringe(frame)
    if len(syringe_contours) > 0:
        # Draw detected syringe outline
        cv2.drawContours(output, syringe_contours, -1, (255, 0, 0), 2)
        
        # Find the largest contour - likely the main body of the syringe
        largest_contour = max(syringe_contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        cv2.rectangle(output, (x, y), (x+w, y+h), (0, 255, 255), 2)
        
        remarks.append("Pipette detected")
        detection_status["pipette"] = "detected"
    else:
        remarks.append("Pipette NOT detected")
        detection_status["pipette"] = "not detected"
    
    # --- 3. Flap State Detection ---
    flap_info = detect_flaps(frame)
    
    # Draw ROIs for priming and spotON ports
    x1, y1, x2, y2 = flap_info["priming_roi"]
    cv2.rectangle(output, (x1, y1), (x2, y2), (0, 0, 255), 2)
    cv2.putText(output, f"Priming: {'Closed' if flap_info['priming_closed'] else 'Open'}", 
                (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    x1, y1, x2, y2 = flap_info["spoton_roi"]
    cv2.rectangle(output, (x1, y1), (x2, y2), (0, 0, 255), 2)
    cv2.putText(output, f"SpotON: {'Closed' if flap_info['spoton_closed'] else 'Open'}", 
                (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    # Update overall flap status
    flap_status = "Closed" if flap_info["flaps_closed"] else "Open"
    remarks.append(f"Flaps are {flap_status}")
    detection_status["flaps"] = flap_status
    
    # --- 4. Liquid Overflow Detection ---
    overflow_info = detect_overflow(frame)
    
    # Draw overflow ROI
    x1, y1, x2, y2 = overflow_info["overflow_roi"]
    cv2.rectangle(output, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    # Update overflow status
    overflow_status = "Overflowing" if overflow_info["is_overflowing"] else "Normal"
    cv2.putText(output, f"Overflow: {overflow_status}", (x1, y1-10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    remarks.append(f"Liquid overflow: {overflow_status}")
    detection_status["overflow"] = overflow_status
    
    # --- 5. Overall Evaluation ---
    # Passing criteria: 
    # - Flaps are closed (as shown in the reference image)
    # - No overflow
    # - Fuel cell holes detected (when open)
    # - Pipette detected (when present)
    if (flap_status == "Closed" and 
        overflow_status == "Normal" and 
        detection_status["pipette"] == "detected" and 
        detection_status["fuel_cell_holes"] == "detected"):
        overall = "PASS"
    else:
        overall = "FAIL"
    
    cv2.putText(output, f"Overall: {overall}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0,
                (0, 255, 0) if overall == "PASS" else (0, 0, 255), 2)
    
    remarks.append(f"Overall: {overall}")
    detection_status["overall"] = overall
    
    return output, remarks

def capture_frames():
    global output_frame, detection_status, lock
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Cannot open camera")
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to fetch frame")
            break
        
        # 1. Process the frame (detect flaps, pipette, overflow, holes)
        processed_frame, remarks = process_frame(frame)
        
        # 2. Update sensor readings (simulated)
        detection_status["temperature"] = f"{read_temperature()} °C"
        detection_status["pressure"] = f"{read_pressure()} kPa"
        detection_status["motion"] = read_motion()
        detection_status["ultrasonic"] = f"{read_ultrasonic()} cm"
        
        # For debugging: print remarks to console
        for remark in remarks:
            print(remark)
        
        # Update the global frame with a lock
        with lock:
            output_frame = processed_frame.copy()
        
        time.sleep(1/30.0)  # ~30 FPS
    
    cap.release()

# Start capturing frames in a background thread
capture_thread = threading.Thread(target=capture_frames)
capture_thread.daemon = True
capture_thread.start()

def generate_video_stream():
    global output_frame, lock
    while True:
        with lock:
            if output_frame is None:
                continue
            ret, encodedImage = cv2.imencode(".jpg", output_frame)
            if not ret:
                continue
            frame = encodedImage.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.03)

@app.route("/video_feed")
def video_feed():
    return Response(generate_video_stream(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/detection")
def detection():
    with lock:
        status = detection_status.copy()
    return jsonify(status)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analytics")
def analytics():
    return render_template("analytics.html")

@app.route("/history")
def history():
    return render_template("history.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=9000, threaded=True)