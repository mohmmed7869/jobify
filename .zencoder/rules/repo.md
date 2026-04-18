---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
The "Smart Recruitment Platform" (منصة التوظيف الذكية) is an advanced AI-driven system designed to bridge the gap between talent and job opportunities. It features a modern web architecture with a React frontend, a Node.js backend, and a specialized Python AI microservice for advanced processing such as resume parsing and job matching.

## Repository Structure
The repository is organized as a monorepo with three primary components:
- **backend/**: Core Node.js service for business logic, authentication, and database management.
- **client/**: React-based frontend application for users (employers and job seekers).
- **ai-service/**: Python-based microservice dedicated to AI operations (NLP, matching, parsing).

## Projects

### Backend (Node.js Service)
**Configuration File**: [./backend/package.json](./backend/package.json)

#### Language & Runtime
**Language**: JavaScript / TypeScript  
**Version**: Node.js >=18.0.0  
**Build System**: NPM  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `express`, `fastify`: Web frameworks.
- `mongoose`, `sequelize`, `pg`, `mongodb`: Database ORMs/Drivers (MongoDB & SQL).
- `socket.io`: Real-time communication.
- `passport`, `jsonwebtoken`: Authentication.
- `openai`: AI integration.
- `bull`: Task queue management.
- `elasticsearch`: Search engine.

#### Build & Installation
```bash
cd backend
npm install
npm start
```

#### Docker
**Dockerfile**: [./backend/Dockerfile](./backend/Dockerfile)
**Image**: `node:18-alpine`
**Configuration**: Runs on port 5000 (internally mapped in compose).

#### Testing
**Framework**: Jest
**Test Location**: Throughout the project with `.test.js` pattern.
**Run Command**:
```bash
npm test
```

### Client (React Frontend)
**Configuration File**: [./client/package.json](./client/package.json)

#### Language & Runtime
**Language**: JavaScript / React  
**Version**: React 18+  
**Build System**: React Scripts  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `react`, `react-dom`: Core library.
- `tailwindcss`: Styling.
- `axios`: API client.
- `framer-motion`: Animations.
- `react-router-dom`: Routing.
- `react-query`: Data fetching.

#### Build & Installation
```bash
cd client
npm install
npm run build
```

#### Docker
**Dockerfile**: [./client/Dockerfile](./client/Dockerfile)
**Image**: `node:18-alpine` (Build) -> `nginx:alpine` (Serve)
**Configuration**: Multi-stage build serving static files via Nginx on port 80.

### AI Service (Python Microservice)
**Configuration File**: [./ai-service/requirements.txt](./ai-service/requirements.txt)

#### Language & Runtime
**Language**: Python  
**Version**: 3.10  
**Build System**: Pip  
**Package Manager**: pip

#### Dependencies
**Main Dependencies**:
- `fastapi`, `uvicorn`: Web framework and server.
- `transformers`, `torch`, `sentence-transformers`: AI and NLP models.
- `pandas`, `numpy`, `scikit-learn`: Data processing and ML.
- `PyPDF2`, `python-docx`: Document parsing.

#### Build & Installation
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Docker
**Dockerfile**: [./ai-service/Dockerfile](./ai-service/Dockerfile)
**Image**: `python:3.10-slim`
**Configuration**: Serves AI endpoints on port 8000.

## Infrastructure
The entire platform is orchestrated using **Docker Compose**, which manages the following services:
- **mongodb**: Persistent data storage.
- **ai-service**: AI processing endpoints.
- **backend**: API and business logic.
- **client**: Web interface.

**Main Entry Points**:
- Root directory contains `docker-compose.yml` for full stack deployment.
- `start_platform.bat` provided for automated startup on Windows.
