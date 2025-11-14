---
trigger: model_decision
description: Architecutre Design & Guidline to use When making any critical or design decision
---

## Architecture & Design

- The entire backend is built using a **NestJS Modular Architecture** (two apps: `api` and `background`).
- Services contain the core business logic (DRY principle is paramount).
- Controllers handle HTTP requests, input validation (DTOs), and consistent responses.
- **Modularity:** Ensure all business concerns (Auth, Vetting, Roles, Payment) are cleanly isolated in their own modules.

## Database & Data

- We are using **PostgreSQL** for the primary database (hosted on Railway).
- Use **Type** for all database interactions.
- Use migrations for all database schema changes.
- **Data Validation:** Implement strong validation checks (using class-validator) on all incoming requests to ensure clean data for the matching algorithm.

## "JobStack" Technical Focus

- **Authentication (JWT/RBAC):** Implement Role-Based Access Control (RBAC) across all modules for three key roles: `Admin`, `Employer`, and `JobSeeker`.
- **Payments:** Integrate with **Paystack** for all transaction and payment flow management.
- **Background Processing:** Use **Bull/Redis** for all asynchronous tasks, including the **Smart Matching Algorithm** and recommendation engine emails. The `background` service is dedicated to these tasks.
- **Email:** Integrate with **Brevo** for all transactional email notifications (e.g., job recommendations, status updates).
- **Cloud Storage:** Use **iDrive e2** for secure storage of all documents (CVs, portfolios, vetting docs).

## Environment Setup

- The development environment must be consistent across all machines using **Docker and Docker Compose**. All service containers (API, Background, DB, Redis) must be configured in `docker-compose.yml`.

## General Code Standards

- Follow the existing folder structure and naming conventions (`src/module/submodule/`).
- Write clean, readable, and **modular** code that adheres to the **DRY (Don't Repeat Yourself)** principle.
- **Comments:** Add concise comments only for complex or non-obvious logic. The code must be self-descriptive without excessive, verbose commenting.
- **Branch Strategy:** Adhere to: `main` (production), `develop` (integration), `feature/[feature-name]` (development).
- Use a structured logger like **Pino** for all application logging.
- for every module you create, you must create a readme file in the module folder, to highlight it's purpose and how it works(the flow). not when editing a module, only when creating.
