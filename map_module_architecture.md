# GIS & Interactive Map Module Architecture

This document provides a comprehensive architectural overview of the GIS & Interactive Map Module, designed to assist in creating your hackathon presentation slides.

## 1. High-Level Architecture Overview

The GIS & Interactive Map module is a full-stack, real-time spatial weather intelligence and early-warning visualization platform. It combines Web Mercator tile rendering, live satellite and radar Doppler time-series loops, atmospheric vector mathematics, and an in-memory spatial bounding box crop tool for direct AI conversational analytics.

The architecture is split into three main layers:
1. **Frontend Layer (React UI, Leaflet Canvas & Client State Hooks)**
2. **Core Processing & GIS Analytics Layer (Spatial Compute, Dynamic Filters & PIP Analytics)**
3. **Data & Integration Layer (OpenWeather, RainViewer, SACHET/NDMA & Cross-Module Bridges)**

---

## 2. Frontend Layer (React)

The frontend delivers a high-performance, interactive geospatial interface built with Leaflet v1.9.4 and Mapbox GL, styled with glassmorphism and Tailwind CSS.

* **Map Viewport Engine (`MapCanvas.jsx`)**:
  * Renders full-screen interactive spatial maps using the Web Mercator projection (`EPSG:3857`).
  * Enforces world coordinate boundaries (`maxBounds`, `noWrap`) to prevent repetitive tile wrapping.
  * Supports dynamic base style switching between high-detail **Streets** (OpenStreetMap) and high-resolution **Satellite** (ArcGIS World Imagery).
  * Embeds an auto-pulsing blue GPS marker (`📍 You Are Here`) using the HTML5 Geolocation API (`navigator.geolocation`).
* **Spatial Crop & Lock Tool (`MapCropTool.jsx`)**:
  * **Two-Stage Research Workflow**:
    1. **Crop Activation**: Renders an interactive dotted bounding box on the map canvas.
    2. **Framing & Lock**: Researchers can zoom and pan freely across India to frame their exact study area.
    3. **In-Memory Data Dispatch**: Clicking **"Lock Map Region"** calculates geographic coordinates, centroid, active layers, and intersecting hazards, and transmits the payload directly to the Chatbot without generating or saving physical disk screenshots.
* **Telemetry & Hazard Panels (`WeatherStatsCard.jsx`, `AlertListPanel.jsx`)**:
  * **WeatherStatsCard**: Displays live real-time observation metrics (Temperature, Feels-Like, Humidity, Wind Velocity, Atmospheric Pressure, Visibility) fetched from OpenWeatherMap.
  * **AlertListPanel**: Floating bottom-left feed rendering 12 active NDMA/SACHET severe disaster warnings with severity badges (Red, Orange, Yellow) and click-to-fly map centering.
* **Dynamic Overlays (`WindDirectionLayer.jsx`, `CycloneOverlay.jsx`, `RadarPlaybar.jsx`)**:
  * **Wind Direction Vectors**: Animated rotating bearing arrows ($^\circ$ angle + $km/h$) mapped across 12 major Indian meteorological sectors.
  * **Cyclone Remal Tracking Engine**: Visualizes 8 historical points, 4 forecast points, a 72-hour forecast uncertainty cone, wind radii buffers, and a spinning storm eye.
  * **RadarPlaybar**: 13-frame past and nowcast precipitation Doppler radar animation loop with interactive timeline scrubber and opacity controls.
* **State Management (`WeatherContext.jsx`)**:
  * Manages global reactive state for `selectedLocation`, `userLiveLocation`, `activeAlerts`, and `croppedSpatialContext`.

---

## 3. Core Processing & GIS Analytics Layer

The spatial compute engine operates on multi-source raster and vector meteorological data streams.

### A. Tile Rendering & Heatmap Processing Engine
* **OpenWeatherMap 2.0 Tile Engine**: Renders high-resolution raster tile layers for Thermal Heatmaps (`temp_new`), Wind Velocity (`wind_new`), and Cloud Density (`clouds_new`).
* **Dynamic Contrast Transformation**: Applies custom CSS post-processing filters (`saturate(2.0) contrast(1.3) brightness(1.1)`) to ensure thermal gradients are vivid and readable over both light and dark basemaps.
* **RainViewer Tile Optimization**: Enforces `maxNativeZoom: 6` tilecache interpolation to eliminate "Zoom level not supported" watermark boxes across Indian coordinates.

### B. Geospatial Bounding & Analytics Engine
* **Bounding Box Calculation**: Dynamically extracts `[SouthWest, NorthEast]` latitude/longitude extents and geometric centroids.
* **Point-in-Polygon (PIP) Hazard Intersection**: Cross-references user-drawn spatial bounding boxes against active SACHET disaster polygons to filter out localized flood, landslide, and thunderstorm risks.
* **Reverse Geocoding & AI Prompt Construction**: Resolves coordinates to Indian district/state names via Open-Meteo and builds pre-formatted natural language prompts for AI synthesis.

---

## 4. Disaster & Early Warning Tracking Engine

The GIS module serves as the primary visual command center for severe meteorological hazards across India.

* **SACHET / NDMA (National Disaster Management Authority) Feed**:
  * Renders 12 live severe emergency warnings across India:
    * **Floods**: River Bagmati (Bihar), Kangra & Mandi (Himachal Pradesh).
    * **Landslides & Heavy Rain**: Dehradun (Uttarakhand), Coastal Mumbai (Maharashtra).
    * **Severe Thunderstorms & Lightning**: Lucknow/Unnao (UP), Surat/Vadodara (Gujarat).
    * **Extreme Heatwaves**: Bikaner/Jaisalmer (NW Rajasthan).
    * **Marine Squalls & High Waves**: Sundarbans (West Bengal - 3.5m waves), Dadra & Nagar Haveli.
* **IMD Cyclone Tracking & Forecast Cone Engine**:
  * Tracks tropical cyclones (e.g., Cyclone Remal 2024 in the Bay of Bengal).
  * Simulates the 72-hour forecast path, uncertainty cone widening polygon, and gale-force wind threshold radii ($>64$ knots).

---

## 5. Integration with Other Modules

The GIS & Interactive Map module acts as the spatial telemetry foundation, sharing real-time geospatial coordinates and hazard data with all other modules in the WeatherGPT ecosystem.

* **WeatherGPT Chatbot Integration**:
  * When a researcher locks a map region, the spatial bounding box, active layer summary, and local hazard alerts are dispatched directly into `WeatherContext`.
  * The Chatbot automatically intercepts this payload upon tab switch and triggers an immediate comprehensive spatial weather analysis prompt with Google Gemini AI.
* **Farmer/Agricultural Module Integration**:
  * Exports localized precipitation radar nowcasts and thermal anomaly bounds to the Farmer Advisory dashboard to identify high-risk agricultural zones.
* **Aviation & Marine Weather Briefing Integration**:
  * Supplies wind direction bearing vectors ($^\circ$ angle + $km/h$), coastal wave heights (INCOIS), and cloud density layers for flight path and maritime route briefings.
* **Alerts & Warning Engine Integration**:
  * Synchronizes 12 active SACHET / IMD hazard markers directly with the centralized alerts database.
