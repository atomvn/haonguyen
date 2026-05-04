---
layout: page
title: UAV swarm system for SAR missions
description: "UAV swarm system project is developed to solve problems in SAR missions after disasters such as: typhoon, hurricane, landslide..."
img: assets/img/projects/UAVSwarmSystem/SystemDiagram.jpg
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

#### How to use QtWenEngine?
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

*Step 3: Advanced features?
**Loading Local HTML:** Instead of a URL, you can render raw strings:
```python
self.browser.setHtml("<html><body><h1>Hello!</h1></body></html>")
```
**Executing JavaScript:** You can run JS from Python using:
```python
self.browser.page().runJavaScript("console.log('Python called me');")
```

### YOLO
### Mavlink router
### MavSDK
### ROS and Gazebo
### PX4 autopilot

## IV. Product demo 

