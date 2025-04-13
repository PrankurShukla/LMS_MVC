# Learning Management System (LMS)

A modern Learning Management System built with Next.js and Express.js for managing educational content, assignments, and student enrollments.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Options](#setup-options)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [API Documentation](#api-documentation)

## Features

### User Management
- Multi-role support (Admin, Teacher, Student)
- Secure authentication with JWT
- User approval system for new registrations
- Profile management for all users

### Teacher Features
- Create and manage classes
- Upload and manage course materials
- Create and grade assignments
- Student enrollment management
  - Approve/Reject enrollment requests
  - View active and inactive students
  - Manage student status

### Student Features
- Enroll in classes
- View course materials
- Submit assignments
- Track grades and progress

### Admin Features
- User management
- Approve/reject user registrations
- View system statistics

## Tech Stack

### Backend
- Node.js (v18+)
- Express.js
- PostgreSQL
- Prisma ORM
- TypeScript
- JWT Authentication

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- Axios for API requests

## Project Structure

```
├── backend/                 # Backend API server
│   ├── dist/                # Compiled TypeScript
│   ├── node_modules/        # Dependencies
│   ├── prisma/              # Database models and migrations
│   ├── src/                 # Source code
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Main server file
│   ├── .env                 # Environment variables
│   ├── Dockerfile           # Docker configuration
│   ├── package.json         # Dependencies and scripts
│   └── tsconfig.json        # TypeScript configuration
│
├── frontend/                # Next.js frontend
│   ├── .next/               # Next.js build output
│   ├── node_modules/        # Dependencies
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React components
│   │   ├── lib/             # Utility functions
│   │   └── styles/          # CSS styles
│   ├── .env.local           # Environment variables
│   ├── Dockerfile           # Docker configuration
│   ├── next.config.js       # Next.js configuration
│   ├── package.json         # Dependencies and scripts
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── tsconfig.json        # TypeScript configuration
│
├── docker-compose.yml       # Docker Compose configuration
├── docker-run.sh            # Script to run Docker (Linux/Mac)
├── docker-run.ps1           # Script to run Docker (Windows)
└── DOCKER-README.md         # Docker-specific instructions
```

## Setup Options

You can set up the LMS application in two ways:
1. **Local Development Setup** - Best for development, with separate backend and frontend servers
2. **Docker Setup** - Recommended for testing or production, runs the entire stack in containers

## Local Development Setup

### Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/downloads)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd LMS_MVP
```

### Step 2: Database Setup
1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE lms;
   ```

### Step 3: Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/lms?schema=public"

   # JWT Configuration
   JWT_SECRET=your_secret_key_here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```
   Replace `your_password` with your PostgreSQL password.

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Step 4: Frontend Setup
1. In a new terminal, navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the frontend server:
   ```bash
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Docker Setup

For Docker-based deployment, see [DOCKER-README.md](./DOCKER-README.md) for detailed instructions.

Quick start:
```bash
# Windows
.\docker-run.ps1

# Linux/Mac
./docker-run.sh
```

## Usage Guide

### Default Login Credentials
After running the database seed script, you can log in with these accounts:

```
Admin:
- Email: admin@lms.com
- Password: admin123

Teacher:
- Email: teacher@lms.com
- Password: teacher123

Student:
- Email: student@lms.com
- Password: student123
```

### Admin Tasks
1. Log in with admin credentials
2. Approve new user registrations
3. Monitor user activities

### Teacher Tasks
1. Create new classes from the dashboard
2. Add course materials and assignments
3. Manage student enrollments
4. Grade student submissions

### Student Tasks
1. Browse available classes
2. Request enrollment in classes
3. Access course materials
4. Submit assignments
5. View grades and feedback

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check your database credentials in `.env`
   - Try connecting manually: `psql -U postgres -d lms`

2. **Port Already in Use**
   - Check if ports 5000 (backend) or 3000 (frontend) are already in use
   - Change the port in the respective configuration

3. **Prisma Issues**
   - Run `npx prisma generate` after any schema changes
   - For migration issues: `npx prisma migrate reset`

4. **Docker Issues**
   - See the [DOCKER-README.md](./DOCKER-README.md) troubleshooting section

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user details

### Admin Endpoints
- `GET /api/admin/pending-users` - Get all pending users awaiting approval
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user approval status
- `DELETE /api/admin/users/:id` - Delete a user

### User Management
- `PUT /api/users/profile` - Update user profile

### Class Management
- `GET /api/classes` - Get all available classes
- `POST /api/classes` - Create a new class (teacher only)
- `GET /api/classes/:id` - Get details for a specific class
- `PUT /api/classes/:id` - Update a class (teacher only)
- `DELETE /api/classes/:id` - Delete a class (teacher only)

### Teacher Specific Endpoints
- `GET /api/classes/teacher/my-classes` - Get all classes taught by the logged-in teacher
- `GET /api/classes/:classId/enrollments` - Get all enrollments for a specific class
- `GET /api/classes/:classId/enrollments/pending` - Get pending enrollment requests for a class
- `PUT /api/classes/enrollments/:id/status` - Approve or reject an enrollment request
- `PUT /api/classes/submissions/:id/grade` - Grade a student's assignment submission
- `GET /api/classes/assignments/:assignmentId/submissions` - Get all submissions for a specific assignment

### Student Specific Endpoints
- `GET /api/classes/student/my-enrollments` - Get all classes the student is enrolled in
- `GET /api/classes/student/submissions` - Get all assignment submissions made by the student
- `POST /api/classes/enroll` - Request enrollment in a class
- `POST /api/classes/assignments/submit` - Submit an assignment
- `GET /api/classes/assignments/:assignmentId/my-submission` - Get student's own submission for a specific assignment

### Course Materials
- `GET /api/classes/:classId/materials` - Get all materials for a class
- `POST /api/classes/materials` - Add a course material (teacher only)
- `PUT /api/classes/materials/:id` - Update a course material (teacher only)
- `DELETE /api/classes/materials/:id` - Delete a course material (teacher only)

### Assignments
- `GET /api/classes/:classId/assignments` - Get all assignments for a class
- `GET /api/classes/assignments/:id` - Get details for a specific assignment
- `POST /api/classes/assignments` - Create an assignment (teacher only)
- `PUT /api/classes/assignments/:id` - Update an assignment (teacher only)
- `DELETE /api/classes/assignments/:id` - Delete an assignment (teacher only)

### Utility
- `GET /api/health` - Health check endpoint (useful for Docker)
- `GET /` - Welcome message

### Dashboard Statistics
**Note**: The dashboard statistics shown in the teacher and admin dashboards are calculated on the frontend by aggregating data from multiple API calls to the existing endpoints listed above. There are no specific backend endpoints dedicated to dashboard statistics.

- Teacher dashboard statistics are calculated from:
  - `GET /api/classes/teacher/my-classes` - Get classes for aggregation
  - `GET /api/classes/:classId/enrollments` - Get enrollments for each class

- Admin dashboard statistics are calculated by processing user data from:
  - `GET /api/admin/users` - Get all users
  - `GET /api/admin/pending-users` - Get pending users

## License

This project is licensed under the MIT License. 
