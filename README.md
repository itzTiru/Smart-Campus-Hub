# Smart Campus Operations Hub

**IT3030 - Programming Applications and Frameworks | Assignment 2026 (Semester 1)**

A full-stack web application for managing university campus operations including facility bookings, maintenance ticketing, and notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, Spring Security 6, Spring Data JPA |
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Database | MySQL 8 |
| Auth | OAuth 2.0 (Google Sign-In) + JWT |
| Real-time | WebSocket (STOMP over SockJS) |
| CI/CD | GitHub Actions |

## Prerequisites

- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.9+

## Setup & Run

### 1. Database
```sql
CREATE DATABASE smart_campus;
```

### 2. Backend
```bash
cd backend
# Set environment variables (or edit application.yml)
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret

./mvnw spring-boot:run
```
Backend runs at: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

## Project Structure

```
├── backend/          # Spring Boot REST API
│   └── src/main/java/com/smartcampus/
│       ├── controller/    # REST endpoints
│       ├── service/       # Business logic
│       ├── repository/    # Data access
│       ├── entity/        # JPA entities
│       ├── dto/           # Request/Response DTOs
│       ├── security/      # OAuth2 + JWT
│       ├── config/        # App configuration
│       └── exception/     # Error handling
├── frontend/         # React client app
│   └── src/
│       ├── api/           # Axios API clients
│       ├── components/    # UI components
│       ├── pages/         # Route pages
│       ├── hooks/         # Custom hooks
│       ├── store/         # Zustand state
│       └── routes/        # Router config
├── docs/             # Reference documents
└── .github/workflows/  # CI pipeline
```

## Modules & Team Contribution

| Module | Member | Endpoints |
|--------|--------|-----------|
| A - Facilities & Assets | Member 1 | 8 |
| B - Booking Management | Member 2 | 10 |
| C - Tickets & Comments | Member 3 | 13 |
| D - Notifications + E - Auth | Member 4 | 13 |

**Total: 44 REST API endpoints**

## API Documentation

Full API docs available at `/swagger-ui.html` when backend is running.

## License

This project is for academic purposes only (SLIIT IT3030).
