# Learning Management System (LMS)

A modern Learning Management System built with Next.js and Express.js.

## Features

### User Management
- Multi-role support (Admin, Teacher, Student)
- Secure authentication with JWT
- User approval system for new registrations
- Profile management

### Teacher Features
- Create and manage classes
- Upload and manage course materials
- Create and grade assignments
- Student enrollment management
  - Approve/Reject enrollment requests
  - View active and inactive students
  - Manage student status (activate/deactivate)
- Dashboard with statistics
  - Total classes overview
  - Active students count
  - Inactive students count
  - Pending enrollment requests

### Student Features
- Enroll in classes
- View course materials
- Submit assignments
- Track grades and progress
- View enrollment status

### Admin Features
- User management
- Approve/reject user registrations
- View system statistics
- Monitor user activities

## Tech Stack

### Backend
- Node.js (v18+)
- Express.js (v4.18.2)
- PostgreSQL (v14+)
- Prisma ORM (v5.7.1)
- TypeScript (v5.3.3)
- JWT for authentication

### Frontend
- Next.js (v14.0.4)
- React (v18.2.0)
- TypeScript (v5.3.3)
- Tailwind CSS (v3.3.0)
- Axios (v1.6.2)

## Prerequisites

1. Node.js (v18 or higher)
2. PostgreSQL (v14 or higher)
3. Git

## Setup Guide

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lms
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Update .env.local with your backend URL
   ```

4. Start the development servers:
   ```bash
   # In backend directory
   npm run dev

   # In frontend directory
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## API Routes

### Authentication Routes
```
POST /api/auth/register - Register a new user
POST /api/auth/login - User login
GET /api/auth/me - Get current user details
```

### Admin Routes
```
GET /api/admin/users - Get all users
GET /api/admin/pending-users - Get users pending approval
PUT /api/admin/users/:id/status - Update user approval status
DELETE /api/admin/users/:id - Delete a user
```

### Class Management Routes
```
POST /api/classes - Create a new class
GET /api/classes - Get all classes
GET /api/classes/:id - Get class details
PUT /api/classes/:id - Update class details
DELETE /api/classes/:id - Delete a class
GET /api/classes/teacher/my-classes - Get teacher's classes
```

### Enrollment Management Routes
```
POST /api/classes/enroll - Request enrollment in a class
GET /api/classes/:classId/enrollments - Get all enrollments for a class
GET /api/classes/:classId/enrollments/pending - Get pending enrollments
PUT /api/classes/enrollments/:id/status - Update enrollment status (approve/reject)
GET /api/classes/student/my-enrollments - Get student's enrollments
```

### Course Material Routes
```
POST /api/classes/materials - Upload course material
GET /api/classes/:classId/materials - Get class materials
PUT /api/classes/materials/:id - Update material
DELETE /api/classes/materials/:id - Delete material
```

### Assignment Routes
```
POST /api/classes/assignments - Create assignment
GET /api/classes/:classId/assignments - Get class assignments
GET /api/classes/assignments/:id - Get assignment details
PUT /api/classes/assignments/:id - Update assignment
DELETE /api/classes/assignments/:id - Delete assignment
```

### Assignment Submission Routes
```
POST /api/classes/assignments/submit - Submit assignment
GET /api/classes/assignments/:assignmentId/submissions - Get all submissions
GET /api/classes/assignments/:assignmentId/my-submission - Get student's submission
PUT /api/classes/submissions/:id/grade - Grade submission
GET /api/classes/student/submissions - Get student's submissions
```

### Student Management Routes
```
GET /api/classes/:classId/students - Get all students in a class
GET /api/classes/:classId/students/active - Get active students
GET /api/classes/:classId/students/inactive - Get inactive students
PUT /api/classes/students/:id/status - Update student status
```

## Default Credentials

After running the seed script, you can log in with these default accounts:

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 