---
layout: page
title: UAV swarm system for SAR missions
description: "UAV swarm system project is developed to solve problems in SAR missions after disasters such as: typhoon, hurricane, landslide..."
code: https://github.com/atomvn/UAVSwarmSystem
img: assets/img/projects/UAVSwarmSystem/UAVSwarm.jpg
importance: 1
category: work
related_publications: false
---

---
## I. Reasons for the project's creation
Annually an average of 10-12 typhoons moves into the South China Sea and 5-7 of them make landfall directly in Vietnam.
When those storms hit mainland, they usually cause flash floods, landslides in mountainous areas and flooding in plains.
As a result, every year thousands of search and rescue (SAR) missions, which primarily rely on manual labor, are conducted.
Given the fact that there are several critical obstacles and downsides of conventional approacheas. This project aims to
address following challenges of SAR missions:
1. Delays in accessing the disaster-stricken areas.  
2. Difficulties to cover a large area with complex terrain.  
3. Potential risks to the rescue teams.  

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/UAVSwarmSystem/StormPath.jpg" title="Storm path" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Storm paths going into South China Sea in the last 70 years
</div>

---
## II. System architecture
Overall, the system is divided into 3 layers including:
1. The user interface layer is a desktop app built with PyQt framework and Leaflet open-source map.
2. Task processing and algorithm layer.
3. Mission control and UAV communication layer.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/UAVSwarmSystem/SystemDiagram.jpg" title="System diagram" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    UAV swarm system diagram
</div>

---
## III. Key techs
### **Leaflet map**
#### What is Leaflet?
Leaflet is the leading open-source JavaScript library for building interactive, mobile-friendly maps. It is designed with simplicity, performance, and usability in mind.
+ **The Core Concept:** Leaflet is not a map data provider (it doesn't own satellite imagery or road data). Instead, it acts as a "canvas" or a "view port" that displays map tiles from services like OpenStreetMap, Mapbox, or Google Maps.
+ **Size:** It is incredibly lightweight, weighing in at only about 39 KB (gzipped), which is significantly smaller than many of its competitors.

#### Why choose Leaflet?
Developers often prefer Leaflet over other alternatives because of its unique balance of power and simplicity:
+ **Mobile-Friendly:** Out of the box, it is highly optimized for mobile devices, supporting touch gestures like pinch-to-zoom and smooth dragging.
+ **Ease of Use:** Its API is well-documented and intuitive. Even with basic HTML/JavaScript knowledge, you can get a map running in minutes.
+ **Extensibility:** It has a massive ecosystem of plugins. Whether you need to create heatmaps, draw complex geometries, or animate markers, there is likely a plugin already built for it.
+ **Open Source:** It is free to use and has a vibrant community, meaning you aren't locked into expensive proprietary software or restrictive usage limits.

#### How to use Leaflet?
Getting started with Leaflet involves three straightforward steps:

*Step 1: Include the library*
Add the Leaflet CSS and JavaScript files to the <head> section of your HTML document.
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS (Place after CSS) -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

*Step 2: Create a container*
Define a <div> element where the map will be rendered. Ensure you give it a specific id and a defined height.
```html
<div id="map" style="height: 500px; width: 100%;"></div>
```

*Step 3: Initialize the map*
Use JavaScript to set the map's focus (coordinates) and choose a tile provider.
```javascript
// 1. Initialize the map at a specific coordinate (e.g., London) with zoom level 13
var map = L.map('map').setView([51.505, -0.09], 13);

// 2. Add a Tile Layer from OpenStreetMap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Add a Marker with a popup
L.marker([51.505, -0.09]).addTo(map)
    .bindPopup('Hello World! This is a Leaflet map.')
    .openPopup();
```
  
### **QtWebEngine**
#### What is QtWebEngine?
QtWebEngine is a specialized module within the Qt framework (used in PyQt or PySide) that allows you to embed web content into desktop applications.
+ **The Technology Core**: It is powered by the Chromium project (the same engine behind Google Chrome and Microsoft Edge). This means anything that runs in Chrome—HTML5, CSS3, JavaScript, WebGL—will run perfectly inside your PyQt app.

#### Why choose QtWebEngine?
Why embed a whole browser instead of using standard desktop widgets?
+ **Complex Web Content:** If your app needs to display a live website, dynamic HTML reports, or interactive JavaScript charts (like Highcharts or D3.js), QtWebEngine is the best tool for the job.
+ **Hybrid UI Design:** You can design your UI using HTML/CSS (which is often more flexible and visually modern) while using Python to handle the backend system logic.
+ **Modern Web Standards:** Because it uses Chromium, it supports the latest web features and security protocols that standard text widgets cannot handle.
+ **Two-way Interaction:** It allows for "bridging," where Python can trigger JavaScript functions and JavaScript can send data back to your Python code.

#### How to use QtWebEngine?
Because QtWebEngine is quite large, it is often packaged separately from the core PyQt library.

*Step 1: Installation* 
You need to install the specific WebEngine package for your version of PyQt:
```bash
pip install PyQt5-WebEngine
# Or if you are using PyQt6
pip install PyQt6-WebEngine
```
*Step 2: Basic implementation*
Here is a simple script to create a window that renders a website:
```python
import sys
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

class MyBrowser(QMainWindow):
    def __init__(self):
        super().__init__()
        
        # 1. Create the browser widget
        self.browser = QWebEngineView()
        
        # 2. Load a URL
        self.browser.setUrl(QUrl("https://www.google.com"))
        
        # 3. Set the browser as the central widget
        self.setCentralWidget(self.browser)
        self.setWindowTitle("My Embedded Browser")
        self.resize(1024, 768)

app = QApplication(sys.argv)
window = MyBrowser()
window.show()
sys.exit(app.exec_())
```

*Step 3: Advanced features?*  
**Loading Local HTML:** Instead of a URL, you can render raw strings:
```python
self.browser.setHtml("<html><body><h1>Hello!</h1></body></html>")
```
**Executing JavaScript:** You can run JS from Python using:
```python
self.browser.page().runJavaScript("console.log('Python called me');")
```
  
### **YOLO**
#### What is YOLO?
YOLO (You Only Look Once) is a state-of-the-art Deep Learning algorithm designed for Object Detection.
+ **The core difference:** Before YOLO, older algorithms usually looked at an image multiple times, dividing it into many small regions to scan. YOLO, as its name suggests, only looks once. It passes the entire image through a single neural network one time and instantly predicts both the locations and types of objects.
+ **The task:** YOLO perform two tasks simultaneously:
  + Determining the Bounding Box around an object.
  + Performing Classification to identify what the object is (e.g., person, car, dog, cat).

#### Who choose YOLO?
YOLO has become the "king" of object detection because of the following reasons:
+ **Extreme Speed (Real-time):** This is its greatest advantage. Because it only scans the image once, YOLO can process live video (from 45 to over 150 frames per second) with almost zero lag.
+ **High Accuracy:** Despite prioritizing speed, the latest versions (such as YOLOv8, v10, or v11) offer impressive accuracy and are less likely to confuse background patches with actual objects.
+ **Global Context:** Because it processes the whole image at once, YOLO understands the relationship between objects better than methods that crop images into pieces.
+ **Versatility:** YOLO is optimized enough to run on edge devices with limited hardware, such as Raspberry Pi, Jetson Nano, or smartphones.

#### How to use YOLO?
Today, using YOLO has become incredibly simple thanks to libraries like *ultralytics*.

*Step 1: Installation*
You can install the library via your terminal/command prompt:
```bash
pip install ultralytics
```
*Step 2: Implementation with Python*
You can use a Pre-trained model to immediately detect 80 common object types (like cars, people, chairs, etc.).
```python
from ultralytics import YOLO

# 1. Load a YOLO model (v8n - "nano" is the fastest/lightest version)
model = YOLO('yolov8n.pt')

# 2. Run detection on an image or video
results = model.predict('image.jpg', save=True, conf=0.5)

# 3. View results
for result in results:
    print(result.boxes)  # Prints the coordinates of the bounding boxes
```
*Step 3: Training on Custom Data*
If you want YOLO to detect specific things (e.g., product defects on a conveyor belt or specific license plates), you follow these steps:
+ **Labeling:** Use tools like LabelImg or Roboflow to draw boxes and name objects in your custom dataset.
+ **Training:** Run a simple command: model.train(data='config.yaml', epochs=100).
  
### **MAVLink-router**
#### What is MAVLink-router?
MAVLink-router is a specialized middleware software designed to run on Linux-based systems (typically on a Companion Computer like a Raspberry Pi or Jetson Nano).
+ **Main function:** It acts as a "distribution hub" for MAVLink packets (the communication protocol for drones). it receives data from one source and routes it to multiple destinations.
+ Connectivity: It supports routing data across various interfaces, including:
  +UART: Direct physical connection to a Flight Controller (e.g., Pixhawk).
  +UDP: Wireless data transmission (Wi-Fi, 4G/5G).
  +TCP: Reliable connections for specific applications requiring flow control.

#### Why do we need MAVLink-router?
Flight Controllers usually have a limited number of physical Serial (Telemetry) ports. MAVLink-router solves several architectural challenges:
+ **Data Sharing (Multiplexing):** You can have a single drone stream data to multiple endpoints simultaneously (e.g., to a Ground Control Station, to an onboard computer for image processing, and to a remote server via 4G).
+ **Protocol Conversion:** It bridges data from Serial/UART (hardware level) to Network/IP (UDP/TCP), allowing you to transmit drone data over long distances via the Internet.
+ **Performance & Stability:** Written in C++, it is incredibly lightweight and stable. It consumes far fewer CPU resources compared to other alternatives like MAVProxy, making it ideal for embedded systems.
+ **Message Filtering:** It can be configured to filter specific messages, ensuring that high-bandwidth data stays onboard while only essential telemetry is sent over weak radio links.

#### How to use MAVLink-router
*Step 1: Installation*
On a Linux system, you generally build it from the source:
```bash
git clone https://github.com/mavlink-router/mavlink-router.git
cd mavlink-router
git submodule update --init --recursive
meson setup build .
ninja -C build
sudo ninja -C build install
```
*Step 2: Configuration (main.conf)*
You define your inputs and outputs in a configuration file (usually located at */etc/mavlink-router/main.conf*):
```
[General]
TcpServerPort=5760
# Endpoint 1: Connection to the Flight Controller via Serial
[UartEndpoint To_FC]
Device = /dev/ttyAMA0
Baud = 921600
# Endpoint 2: Sending data to Ground Control (QGroundControl) via Wi-Fi
[UdpEndpoint To_GCS]
Mode = Normal
Address = 192.168.1.50
Port = 14550
# Endpoint 3: Internal data for a Python app running on the same Pi
[UdpEndpoint Internal_App]
Mode = Normal
Address = 127.0.0.1
Port = 14540
```

*Step 3: Execution*
Once configured, simply run the daemon:
```bash
mavlink-routerd -c /etc/mavlink-router/main.conf
```
Now, any data coming from the Flight Controller (To_FC) is automatically duplicated and routed to both your GCS and your internal application.
  
### **MAVSDK**
If MAVLink-router is the "data dispatcher," then MAVSDK-Python is the "virtual pilot" that allows you to command your drone using Python in a simple and modern way.
#### What is MAVSDK?
MAVSDK (MAVLink Software Development Kit) is a powerful set of programming tools for interacting with vehicles that use the MAVLink protocol (such as drones running PX4 or ArduPilot firmware).
+ **The Core Concept:** It is a high-level library. Instead of manually packing complex MAVLink messages (like SET_POSITION_TARGET_LOCAL_NED), you simply call human-readable functions like goto_location().
+ **Architecture:** MAVSDK-Python is actually a wrapper for a C++ core. It uses gRPC for communication, making data transfer extremely fast and enabling robust asynchronous processing.
  
#### Why choose MAVSDK?
In the world of Python for drones, the biggest competitor was DroneKit. However, MAVSDK is rapidly becoming the standard because:
+ **Asynchronous Support (asyncio):** Drones wait for no one; telemetry data (position, battery) arrives constantly. MAVSDK’s async/await structure allows your code to receive sensor data and send flight commands simultaneously without freezing.
+ **Simplicity:** Complex tasks like taking off, landing, following mission waypoints, or setting up a geofence are wrapped into just a few lines of code.
+ **Reliability:** Developed by Auterion and the Dronecode community, it is heavily tested and supports the latest hardware standards.
+ **Cross-Platform:** It runs seamlessly on Linux (Raspberry Pi, Jetson), macOS, and Windows.

#### How to use MAVSDK?
*Step 1: Installation*
Install the library using pip:
```bash
pip install mavsdk
```
*Step 2: Basic implementation*
Everything in MAVSDK-Python typically runs within an async function. Here is a basic script to make a drone take off:
```python
import asyncio
from mavsdk import System

async def run():
    # 1. Connect to the drone (e.g., via UDP to a simulator)
    drone = System()
    await drone.connect(system_address="udp://:14540")

    print("Waiting for drone to connect...")
    async for state in drone.core.connection_state():
        if state.is_connected:
            print("Drone connected!")
            break

    # 2. Arm the drone
    print("-- Arming")
    await drone.action.arm()

    # 3. Takeoff
    print("-- Taking off")
    await drone.action.takeoff()

    await asyncio.sleep(5) # Hover for 5 seconds

    # 4. Land
    print("-- Landing")
    await drone.action.land()

if __name__ == "__main__":
    asyncio.run(run())
```

*Step 3: Monitoring telemetry*
You can stream data like battery levels or GPS coordinates continuously without blocking your main command loop:
```python
async def print_battery(drone):
    async for battery in drone.telemetry.battery():
        print(f"Battery: {battery.remaining_percent * 100}%")
```
  
### **PX4 autopilot**
#### What is PX4 autopilot?
PX4 is an incredibly powerful open-source flight control software (flight stack) designed to control autonomous vehicles, including drones (multirotors), fixed-wing aircraft, VTOLs, ground rovers, and even submarines.
+ **The Ecosystem:** PX4 is a core part of the Dronecode project (under the Linux Foundation). It typically runs on dedicated flight control hardware like the Pixhawk series.
+ **Architecture:** It is built on top of the NuttX Real-Time Operating System (RTOS). PX4 is highly modular, meaning different processes (like position control, GPS handling, and battery management) run independently and communicate via the uORB messaging bus.

#### Why choose PX4?
PX4 is more than just a controller; it is an industry standard for several reasons:
+ **Maximum Flexibility:** It supports almost any vehicle configuration—from standard quadcopters and fixed-wings to complex Vertical Take-Off and Landing (VTOL) planes and underwater robots.
+ **Enterprise Reliability:** Trusted by major corporations (like Auterion) and research institutions worldwide, PX4 is known for its robust fail-safes and stability in demanding environments.
+ **Companion Computer Integration:** It is designed to work perfectly with onboard computers (Raspberry Pi, Jetson Nano) via MAVLink, enabling advanced AI, computer vision, and obstacle avoidance.
+ **Simulation Environments (SITL/HITL):** PX4 provides powerful simulation tools (Gazebo, jMAVSim). You can test your flight code for thousands of hours on a computer before ever flying a real drone, significantly reducing the risk of crashes.

#### How to use PX4?
*Step 1: Flashing firmware to hardware*
You need a Flight Controller (FC) like a Pixhawk 6C or Orange Cube.
1. Install QGroundControl (GCS) on your computer.
2. Connect your Pixhawk via USB.
3. Use QGroundControl to upload the latest PX4 firmware onto the board.

*Step 2: Configuration and calibration*
Through the QGroundControl interface, you must complete the following setups:
1. Airframe: Select the type of drone you are using (e.g., Generic Quadcopter X).
2. Sensors: Calibrate the accelerometer, compass, and gyroscope.
3. Radio/ESC: Set up your remote controller and calibrate the Electronic Speed Controllers (ESCs).

*Step 3: Programming and flying*
+ **Manual/Autonomous Flight:** You can plan a mission (waypoints) on the map in QGroundControl and click "Start" for the drone to fly itself.
* **Offboard Programming:** Use MAVSDK or ROS 2 to send commands from a companion computer. For example: "If the camera detects an object, tell PX4 to move 5 meters to the left."
  
### **ROS 2 and Gazebo** 
#### What are ROS 2 and Gazebo?
**ROS 2 (Robot Operating System 2)**
Despite the name, ROS 2 is not an actual operating system like Windows or Linux. It is a Middleware—a collection of software frameworks, tools, and libraries that help different parts of a robot (sensors, motors, AI algorithms) "talk" to each other through a structured messaging system.  
**Gazebo**
Gazebo is a powerful 3D Simulator. It allows you to create a virtual environment with realistic physics (gravity, friction, wind) to test your robots. It mimics how a robot would behave in the real world without needing the physical hardware.

#### Why do we need this duo?
The combination of ROS 2 and Gazebo solves some of the toughest challenges in robotics:
+ **Risk and Cost Reduction:** Instead of buying a physical robot worth thousands of dollars and risking a crash during code testing, you can run it in Gazebo for free and with zero physical risk.
+ **Modular Architecture (ROS 2):** You can write code for a LiDAR sensor in C++, image processing in Python, and ROS 2 will connect them seamlessly. If you change a sensor, you only replace a small "node" rather than rewriting the entire system.
+ **Scalability:** ROS 2 is designed to support multi-robot systems and real-time industrial applications, areas where the original ROS 1 struggled.
+ **Testing Any Environment:** You can simulate a robot on the moon, underwater, or in a complex warehouse maze without ever leaving your desk.

#### How to use them?
*Step 1: Installation*
Follow [installation guide](https://wiki.ros.org/noetic/Installation/Ubuntu) on ROS official webpage.
Also, you can find Gazebo [installation guide](https://classic.gazebosim.org/tutorials?cat=install&tut=install_ubuntu&ver=9.0) on their official webpage.

*Step 2: Create a Robot Model (URDF/SDF)*
You describe the physical structure of your robot—how many wheels it has, where the joints are, and how much it weighs—using XML-based files called URDF (Unified Robot Description Format). Gazebo reads this file to render the robot in 3D space.

*Step 3: Write Control Nodes in ROS 2*
You write small programs (Nodes) to control the robot. For example:
+ Node A: Reads distance data from a virtual laser sensor in Gazebo.

+ Node B: Processes data from Node A and decides "Turn left if an obstacle is detected."

+ Node C: Sends speed commands to the robot's wheels inside Gazebo.

*Step 4: Step 4: Launch the Simulation*
Using the ros2 launch tool, you start the virtual world and your control algorithms simultaneously.
```bash
# Example: Launching a TurtleBot3 robot in a simulated world
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py
```
---
## IV. Product demo 
Click [here](https://drive.google.com/file/d/1V7N42ICKU3VE039P5JDjl06-08R247-n/view?usp=drive_link) to see the product demo video.

