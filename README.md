# Learning Management System (LMS)

A full-stack application for managing online courses, student enrollments, assignments, and learning materials.

## Features

- **User Authentication**: Secure login/registration with JWT
- **Role-Based Access**: Different views for students and teachers
- **Class Management**: Create and manage classes, enrollments, and course materials
- **Assignment System**: Create, submit, and grade assignments
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- PostgreSQL database
- npm or yarn

### Installation

#### Clone the repository

```bash
git clone <repository-url>
cd lmsbase
```

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment variables:
   Create a `.env` file in the backend directory with the following contents:

```
DATABASE_URL="postgresql://username:password@localhost:5432/lms?schema=public"
JWT_SECRET="your-secret-key"
PORT=3001
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Seed the database (optional):

```bash
npx prisma db seed
```

6. Start the backend server:

```bash
# For PowerShell
npm run dev
```

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment variables:
   Create a `.env.local` file in the frontend directory with the following contents:

```
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

4. Start the frontend development server:

```bash
# For PowerShell
npm run dev
```

### PowerShell Notes

If you're using PowerShell, use separate commands instead of the `&&` operator:

```powershell
cd C:\path\to\directory
npm run dev
```

## Usage Guide

### User Registration/Login

1. Access the application at `http://localhost:3000`
2. Register as either a teacher or student
3. Log in with your credentials

### For Teachers

#### Dashboard

- View statistics, classes, and pending enrollment requests
- Approve or reject student enrollment requests

#### Class Management

- Create new classes with name and description
- View and manage your existing classes

#### Within a Class

- **Materials**: Add, edit, and delete course materials
- **Assignments**: Create assignments with due dates
- **Enrollments**: Manage student enrollments
- **Submissions**: View and grade student submissions

### For Students

#### Dashboard

- View enrolled classes and available classes
- Request enrollment in classes

#### Within a Class

- **Materials**: Access course materials uploaded by the teacher
- **Assignments**: View assignments, submit answers, and see grades
- Track assignment deadlines and submission status

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in and get JWT token

### Classes

- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get a specific class
- `POST /api/classes` - Create a new class (teachers only)
- `PUT /api/classes/:id` - Update a class (teachers only)
- `DELETE /api/classes/:id` - Delete a class (teachers only)

### Enrollments

- `POST /api/classes/enroll` - Request enrollment (students only)
- `PUT /api/classes/enrollments/:id/status` - Update enrollment status (teachers only)
- `GET /api/classes/:classId/enrollments` - Get all enrollments for a class (teachers only)
- `GET /api/classes/student/my-enrollments` - Get student's enrollments (students only)

### Materials

- `GET /api/classes/:classId/materials` - Get materials for a class
- `POST /api/classes/materials` - Create course material (teachers only)
- `PUT /api/classes/materials/:id` - Update course material (teachers only)
- `DELETE /api/classes/materials/:id` - Delete course material (teachers only)

### Assignments

- `GET /api/classes/:classId/assignments` - Get assignments for a class
- `GET /api/classes/assignments/:id` - Get specific assignment
- `POST /api/classes/assignments` - Create assignment (teachers only)
- `DELETE /api/classes/assignments/:id` - Delete assignment (teachers only)

### Submissions

- `POST /api/classes/assignments/submit` - Submit assignment (students only)
- `PUT /api/classes/submissions/:id/grade` - Grade submission (teachers only)
- `GET /api/classes/assignments/:assignmentId/submissions` - Get submissions for an assignment (teachers only)
- `GET /api/classes/student/submissions` - Get student submissions (students only)

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Run `npx prisma db pull` to verify connection

2. **API Connection Errors**:
   - Ensure backend server is running
   - Verify NEXT_PUBLIC_API_URL is correct in frontend .env.local
   - Check browser console for CORS errors

3. **PowerShell Command Issues**:
   - Use semicolons (`;`) instead of ampersands (`&&`) to chain commands
   - Run each command separately to isolate issues

### Starting Servers with PowerShell

When using PowerShell, here are the explicit commands to start both servers:

#### Backend Server
```powershell
# Navigate to backend directory
cd C:\Users\<username>\path\to\lmsbase\backend

# Start backend server
npm run dev
```

#### Frontend Server
```powershell
# Navigate to frontend directory
cd C:\Users\<username>\path\to\lmsbase\frontend

# Start frontend server  
npm run dev
```

Make sure to run these commands in separate PowerShell windows to have both servers running simultaneously.

#### Using the Start-Servers Script

For convenience, a PowerShell script is included to start both servers automatically:

```powershell
# From the project root directory
.\start-servers.ps1
```

This script will:
- Start the backend server in a new PowerShell window
- Start the frontend server in a new PowerShell window
- Display URLs for both servers

The script requires PowerShell and must be run from the project root directory.

## License

This project is licensed under the MIT License. 