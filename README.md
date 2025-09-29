# JobStack: The Pre-Vetted African Talent Platform

## 🌟 Project Overview

**JobStack** is a two-sided marketplace designed to simplify hiring for businesses in the Nigerian market, starting in Lagos. We connect employers with pre-vetted talent for both full-time **Roles** (jobs) and contract-based assignments. Our unique value proposition is handling the entire vetting, matching, and payment process, allowing businesses to focus purely on operations.

### Key Goals

- Provide a seamless **Recruiter** experience for posting **Roles**.
- Offer an intuitive platform for **Job Seekers** to find and apply for relevant work.
- Centralize the agency's **vetting** and **matching** process.

---

## 🛠️ Technical Stack & Architecture

JobStack is built on a modern, scalable, and fully typed stack.

| Component              | Technology                                   | Role                                                                                       |
| :--------------------- | :------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Backend API**        | **NestJS** (Node.js/TypeScript)              | Handles core business logic, API requests, and authentication.                             |
| **Background Service** | **NestJS** (Node.js/TypeScript)              | Dedicated service for asynchronous tasks (e.g., Smart Matching Algorithm, sending emails). |
| **Database**           | **PostgreSQL**                               | Primary data storage (User profiles, Roles, Payments).                                     |
| **Caching**            | **Redis**                                    | High-speed cache for sessions, user data, and frequently accessed items.                   |
| **Job Queue**          | **Bull** (with Redis)                        | Manages and processes background tasks reliably.                                           |
| **Containerization**   | **Docker & Docker Compose**                  | Ensures environment consistency for all services.                                          |
| **Frontend**           | **[Specify Framework: e.g., Next.js/React]** | User Interface for Recruiters and Job Seekers.                                             |
| **Proxy/Gateway**      | **Nginx** (via Railway)                      | Routes traffic and provides security/load balancing.                                       |

---

## ☁️ Hosting & Infrastructure

We utilize a modular, cloud-native hosting setup for easy deployment and scalability.

| Service              | Hosting Platform | Purpose                                                    |
| :------------------- | :--------------- | :--------------------------------------------------------- |
| **API & Background** | **Railway**      | Hosting for our NestJS applications.                       |
| **Database**         | **Railway**      | Managed PostgreSQL instance.                               |
| **Caching/Queue**    | **Railway**      | Managed Redis instance for caching and the Bull job queue. |
| **Frontend**         | **Vercel**       | Hosting for the decoupled frontend application.            |

---

## ⚙️ Core API Modules

The backend logic is organized into several distinct modules (`src/api/`).

| Module              | Purpose                                                        | Key Sub-Modules                                               |
| :------------------ | :------------------------------------------------------------- | :------------------------------------------------------------ |
| **`Auth`**          | Handles user identification and access control.                | `Recruiter`, `JobSeeker`, `Admin` (login/signup logic)        |
| **`User`**          | Manages all user profiles and account settings once logged in. | `Recruiter`, `JobSeeker`, `Admin` (profile updates, settings) |
| **`Roles`**         | Manages all job postings and contract listings.                | `Listing` (Creation, Editing), `Application` (Apply, Status)  |
| **`Vetting`**       | Manages the verification process for Job Seekers.              | `Status` (Updates), `Documents` (Approval)                    |
| **`Payment`**       | Handles financial transactions through the platform.           | `Paystack`, `Transaction` (Recording payments)                |
| **`Storage`**       | Manages file uploads (CVs, portfolios) securely.               | Integration with **Drive e2** (S3 compatible storage)         |
| **`Notifications`** | Manages communication triggers (emails, in-app alerts).        | Integration with **Brevo** (Email Provider)                   |

---

## 🚀 Getting Started

### Prerequisites

1.  Node.js (v18+) for local script execution.
2.  **Docker and Docker Compose** (Essential for running all services consistently).
3.  Access to the Railway dashboard (for production environment variables).

### Setup & Installation

1.  **Clone the repository:**

    ```bash
    git clone [your-repo-link]
    cd api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or yarn install
    ```

3.  **Environment Variables (`.env`):**
    Create a `.env` file in the root directory and populate it with the necessary credentials.
    _(**Note:** For Docker Compose, your DB and Redis URLs should reference the service names defined in your `docker-compose.yml`.)_

    ```ini
    # Database
    DATABASE_URL="postgresql://user:password@host:port/db_name"

    # Caching & Job Queue
    REDIS_HOST="redis-host"
    REDIS_PORT=6379

    # External Services
    PAYSTACK_SECRET="sk_live_xxxx"
    BREVO_API_KEY="xkeysib-xxxx"
    STORAGE_S3_ENDPOINT="s3.endpoint.com"
    STORAGE_ACCESS_KEY="xxxx"
    STORAGE_SECRET_KEY="xxxx"

    # Application Config
    JWT_SECRET="YOUR_STRONG_SECRET_KEY"
    ```

### Running the Services with Docker Compose

All services (API, Background, PostgreSQL, Redis) are managed via `docker-compose`.

1.  **Build and Run All Services:**
    This command will build the images for both the `api` and `background` apps and start all required containers.

    ```bash
    docker-compose up --build
    ```

2.  **Run Migrations:**
    You will need to run database migrations against the running container.

    ```bash
    # Run a command inside the API container to execute migrations
    docker-compose exec api npm run [your_migration_command]
    ```

3.  **Stopping Services:**

    ```bash
    docker-compose down
    ```

---

## 🤝 Contribution Guidelines

All contributions should follow the established Git Flow and Architectural Guidelines.

1.  Create a feature branch from `main`: `git checkout -b feature/module-name`
2.  Ensure all new code is covered by unit and integration tests.
3.  The Definition of Done requires passing all tests and successful deployment to the staging environment.
