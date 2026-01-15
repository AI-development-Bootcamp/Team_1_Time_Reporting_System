# Documentation

This folder contains all project documentation organized by category.

## Structure

### 📋 [specs/](./specs/)
Project specifications, requirements, and detailed documentation.
- **[specification.md](./specs/specification.md)** - Complete project specification including:
  - Project overview and requirements
  - Technical decisions and stack
  - API endpoints overview
  - Data models (TypeScript & Prisma)
  - Implementation details
  - UI specifications
  - Tasks breakdown

### 🔌 [api/](./api/)
API documentation and endpoint specifications.
- **[API.md](./api/API.md)** - Complete API documentation with:
  - All endpoints with request/response examples
  - Authentication and authorization
  - Error codes and status codes
  - Data model references

### 📊 [models/](./models/)
Data model definitions and TypeScript interfaces.
- **[data-models.md](./models/data-models.md)** - TypeScript interfaces for:
  - User, Client, Project, Task
  - DailyAttendance, ProjectTimeLogs
  - TaskWorker (many-to-many)
  - All enums and types

### 🗄️ [database/](./database/)
Database schema and table definitions.
- **[schema.md](./database/schema.md)** - PostgreSQL table layout:
  - All tables with column definitions
  - Foreign key relationships
  - Data types and constraints

## Quick Links

- **Main README**: [../README.md](../README.md)
- **OpenSpec**: [../openspec/AGENTS.md](../openspec/AGENTS.md) - For change proposals and spec management
