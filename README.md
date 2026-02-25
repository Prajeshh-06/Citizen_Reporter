🏙 Smart Civic Reporter

AI-Powered Civic Issue Reporting & Governance Platform
Built with Next.js, MongoDB, JWT Authentication, and Geo-Spatial Processing

📌 Overview

Smart Civic Reporter is a full-stack civic governance platform that enables citizens to report public infrastructure issues while allowing municipalities and administrators to monitor, manage, and resolve complaints efficiently.

The system integrates:

🧠 AI-based issue priority classification

🗺 GeoJSON ward mapping with point-in-polygon detection

🔐 JWT authentication with Role-Based Access Control

📊 Real-time analytics dashboard

🌐 Dynamic UI with visibility-aware polling

🚀 Live Demo

Production URL:
https://your-vercel-url.vercel.app

🏗 Architecture

The application follows a 3-tier architecture:

1️⃣ Presentation Layer

Next.js (App Router)

React 18

TailwindCSS

Leaflet.js (Map-based location picker)

2️⃣ Application Layer

Next.js API Routes

JWT Authentication Middleware

Role-Based Access Control (RBAC)

AI Priority Engine

MongoDB Aggregation Analytics

3️⃣ Data Layer

MongoDB Atlas (Cloud)

Collections:

users

issues

🔐 Authentication & Authorization
JWT Authentication

Passwords hashed using bcrypt

Signed using secure JWT_SECRET

Stateless authentication

Role-Based Access Control
Role	Capabilities
Citizen	Submit issues, view own issues
Municipality	View ward-specific issues, update status
Admin	View all issues, analytics, promote users
🧠 AI Priority Engine

Location: lib/aiPriorityEngine.js

When a user submits an issue:

Title + Description are analyzed.

Keyword-based weighted scoring is applied.

The system assigns:

priorityScore (1–5)

priorityLabel (Low, Medium, High, Critical)

Optional confidence metric

The user does not manually select priority.

Priority directly impacts:

Dashboard sorting

Municipality urgency

Analytics distribution

🗺 Geo-Spatial Ward Detection

GeoJSON ward boundaries loaded server-side

Turf.js booleanPointInPolygon used for detection

Automatically assigns:

wardNumber

wardName

Ensures jurisdictional routing of complaints.

📊 Analytics

Admin dashboard provides:

Total issue count

Status distribution (Open, In Progress, Resolved)

Priority distribution (Low → Critical)

Dynamic refresh (15-second visibility-aware polling)

Aggregation powered by MongoDB $facet pipeline.

🔄 Real-Time Feel (Polling Strategy)

Instead of WebSockets:

Custom usePolling hook

Polls every 15 seconds

Pauses when browser tab is inactive

Immediate refetch after status updates

Ensures data consistency across sessions.

🛡 Validation & Security

Zod schema validation at API boundary

Required lat/lng enforcement

Category enum allowlist

Duplicate submission throttling (2-minute window)

JWT verification on all protected routes

No client-side trust for role enforcement

📁 Project Structure

app/
 ├── api/
 ├── dashboard/
 ├── login/
 ├── register/

lib/
 ├── aiPriorityEngine.js
 ├── auth.js
 ├── roles.js
 ├── api-utils.js

hooks/
 ├── usePolling.js

components/
 ├── dashboards/
 ├── LocationPickerMap.jsx

 ⚙️ Environment Variables

Create .env.local:
MONGODB_URI=your-mongodb-atlas-uri
DB_NAME=smart_civic_reporter
JWT_SECRET=your-512-bit-random-secret
JWT_EXPIRES_IN=7d

Generate secret:

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

🛠 Installation
git clone https://github.com/yourname/smart-civic-reporter.git
cd smart-civic-reporter
npm install
npm run dev

Open:

http://localhost:3000
🚀 Deployment (Vercel)

Push to GitHub

Import repo in Vercel

Add environment variables

Deploy

🧪 Testing Workflow

Register user (Citizen)

Submit issues via map

Verify AI priority auto-assignment

Promote user to Admin (MongoDB shell)

Access analytics dashboard

Update issue status (Municipality role)

🔮 Future Enhancements

Replace rule-based AI with trained ML model

Image-based issue classification

WebSocket real-time updates

2dsphere geospatial indexing

Comment moderation pipeline

Cloud object storage for image uploads

🎓 Academic Context

This project aligns with:

Participatory Governance Models

SDG-11: Sustainable Cities and Communities

Distributed civic infrastructure management systems

Applied AI in public service workflows

📄 License

MIT License
