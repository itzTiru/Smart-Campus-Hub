# Smart Campus Operations Hub

**IT3030 - Programming Applications and Frameworks | SLIIT 2026**

A full-stack web application for managing university campus operations — facility bookings, maintenance ticketing, real-time notifications, and technician management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.5, Spring Security 6, Spring Data MongoDB |
| Frontend | React 19, Vite 8, Tailwind CSS 4, Zustand 5 |
| Database | MongoDB Atlas |
| Auth | OAuth 2.0/OIDC (Google) + Local (BCrypt/JWT) + Technician JWT |
| Real-time | WebSocket (STOMP over SockJS) |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Testing | JUnit 5, Mockito, Embedded MongoDB |
| CI/CD | GitHub Actions (CI + CD to GCP Cloud Run & Vercel) |

## Features

- Dual auth: Google OAuth2/OIDC + local email/password with admin approval
- Role-based dashboards (Admin, Manager, Technician, User)
- Resource booking with conflict detection, QR check-in, and PDF pass generation
- Maintenance tickets with 8-status workflow, SLA tracking, and file attachments
- Technician accept/decline/done workflow with messaging
- Real-time WebSocket notifications with per-user preferences
- CSV and PDF export for bookings and tickets
- Dark mode

## Prerequisites

- Java 17+
- Node.js 18+
- MongoDB (local or Atlas)
- Maven 3.9+

## Setup & Run

### Backend
```bash
cd backend
export MONGODB_URI=your-mongodb-uri
export JWT_SECRET=your-jwt-secret
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
./mvnw spring-boot:run
```
Runs at `http://localhost:8080` | Swagger UI at `/swagger-ui.html`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`

## Project Structure

```
backend/src/main/java/com/smartcampus/
├── controller/    # REST endpoints
├── service/       # Business logic
├── repository/    # MongoDB data access
├── entity/        # Document models
├── dto/           # Request/Response DTOs
├── security/      # OAuth2 + JWT auth
├── config/        # App & WebSocket config
├── exception/     # Global error handling
└── util/          # Helpers

frontend/src/
├── api/           # Axios API clients
├── components/    # Reusable UI components
├── pages/         # Route pages
├── hooks/         # Custom React hooks
├── store/         # Zustand state management
├── routes/        # Router config
├── styles/        # Global styles
└── utils/         # Utility functions

.github/workflows/
├── ci.yml         # Test, lint, build on push/PR
└── cd.yml         # Deploy backend (GCP) + frontend (Vercel)
```

## API Documentation

Full interactive API docs available at `/swagger-ui.html` when the backend is running.

## License

This project is for academic purposes only (SLIIT IT3030).
