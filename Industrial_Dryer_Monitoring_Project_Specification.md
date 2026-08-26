# Industrial Dryer Monitoring Dashboard -- Project Specification

## Project Overview

Build a production-ready industrial monitoring web application for
displaying live sensor data from **KEPServerEX (OPC UA)**.

The application should be scalable so additional dryers and chambers can
be added later without major UI or code changes.

------------------------------------------------------------------------

## Current Scope

There are currently **3 dryers**.

Each dryer exposes four live sensor values:

-   Top Tunnel Temperature (°C)
-   Top Tunnel Pressure (bar)
-   Bottom Tunnel Temperature (°C)
-   Bottom Tunnel Pressure (bar)

Total live tags: **12**

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   React Router
-   Socket.IO Client
-   Recharts (for future trends)

### Backend

-   Node.js
-   Express
-   node-opcua
-   Socket.IO

------------------------------------------------------------------------

## Data Source

Live values come from:

KEPServerEX → OPC UA → Node.js Backend → WebSocket → React Frontend

Do not hardcode values. Build the frontend so values are received from a
backend API/WebSocket.

------------------------------------------------------------------------

# Pages

## 1. Dashboard

Purpose: Provide a quick overview of all dryers.

Layout:

Three summary cards.

Each card contains:

-   Dryer Name
-   Status
-   Top Temperature
-   Bottom Temperature
-   Top Pressure
-   Bottom Pressure
-   Last Updated
-   View Details button

No charts.

No alarm history.

No excessive information.

------------------------------------------------------------------------

## 2. Dryer Detail Page

Route:

/dryer/1

/dryer/2

/dryer/3

Layout:

Header

-   Dryer Name
-   Status Badge
-   Last Updated

Section 1

Top Tunnel

-   Temperature Card
-   Pressure Card

Section 2

Bottom Tunnel

-   Temperature Card
-   Pressure Card

Section 3

Reserved for Trend Charts

Temperature Trend

Pressure Trend

Section 4

Recent Alarms

Recent Events

------------------------------------------------------------------------

## 3. Alarms Page

Display:

-   Alarm Time
-   Dryer
-   Sensor
-   Severity
-   Description
-   Status

Provide filtering by:

-   Dryer
-   Severity
-   Date

------------------------------------------------------------------------

## 4. Trends Page

Future implementation.

Include placeholder layout for:

-   Temperature Trend
-   Pressure Trend

Controls:

-   Dryer selector
-   Sensor selector
-   Time Range

------------------------------------------------------------------------

## 5. Settings

Placeholder page.

Future settings:

-   OPC UA Endpoint
-   Refresh Rate
-   Alarm Limits
-   User Management

------------------------------------------------------------------------

# Sidebar Navigation

Dashboard

Dryer 1

Dryer 2

Dryer 3

Alarms

Trends

Settings

------------------------------------------------------------------------

# Header

Company Logo placeholder

Title:

Dryer Monitoring Dashboard

Show:

Current Time

Connection Status

KEPServerEX Status

Last Updated

------------------------------------------------------------------------

# Design Requirements

Dark industrial theme.

Large cards.

Rounded corners.

Minimal shadows.

No glassmorphism.

No neon effects.

No clutter.

Designed for a 1920×1080 control room display.

Maximum 6--8 cards visible per screen.

------------------------------------------------------------------------

# Sensor Card

Each sensor card displays:

Icon

Sensor Name

Current Value

Unit

Status Color

Green → Normal

Yellow → Warning

Red → Alarm

Example:

Temperature

68.4 °C

Pressure

1.24 bar

------------------------------------------------------------------------

# Color Palette

Background: #0F172A

Card: #1E293B

Primary: #2563EB

Success: #22C55E

Warning: #F59E0B

Danger: #EF4444

Text: #F8FAFC

Muted Text: #94A3B8

------------------------------------------------------------------------

# Folder Structure

frontend/

-   components/
-   pages/
-   layouts/
-   hooks/
-   services/
-   context/
-   routes/
-   assets/

backend/

-   opcua/
-   websocket/
-   routes/
-   services/
-   config/

------------------------------------------------------------------------

# Backend API

Design the frontend around:

GET /api/dryers

GET /api/dryers/:id

WebSocket

Event:

sensorUpdate

Example payload:

``` json
{
  "dryerId": 1,
  "topTemp": 68.5,
  "bottomTemp": 67.9,
  "topPressure": 1.24,
  "bottomPressure": 1.22,
  "status": "Running",
  "timestamp": "2026-07-23T12:30:00Z"
}
```

------------------------------------------------------------------------

# Scalability

The architecture must support:

Unlimited dryers

Future chambers

Additional sensors

Humidity

Air Flow

Steam Pressure

Motor Status

Fan Status

Trend Charts

Reports

User Authentication

------------------------------------------------------------------------

# UI Goals

Prioritize operator readability.

Avoid overcrowding.

Each page has one clear purpose.

Use reusable components.

Make the dashboard feel similar to modern industrial HMI/SCADA software.
