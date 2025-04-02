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

Before you begin, ensure you have the following installed:

1. **Node.js (v18 or higher)**
   - Download from [Node.js website](https://nodejs.org/)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **PostgreSQL (v14 or higher)**
   - Download from [PostgreSQL website](https://www.postgresql.org/download/)
   - Remember your PostgreSQL password during installation
   - Verify installation:
     ```bash
     psql --version
     ```

3. **Git**
   - Download from [Git website](https://git-scm.com/downloads)
   - Verify installation:
     ```bash
     git --version
     ```

## Detailed Setup Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lms
```

### 2. Database Setup
1. Open PostgreSQL command prompt:
   ```bash
   psql -U postgres
   ```
2. Create the database:
   ```sql
   CREATE DATABASE lms;
   ```
3. Verify the database was created:
   ```sql
   \l
   ```
4. Exit PostgreSQL:
   ```sql
   \q
   ```

### 3. Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
   
4. Configure backend `.env` file with the following content:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/lms"

   # JWT Configuration
   JWT_SECRET=your_secret_key_here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```
   Replace `your_password` with your PostgreSQL password.

5. Initialize the database:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed the database with initial data
   npx prisma db seed
   ```

### 4. Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Configure frontend `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### 5. Start the Application

1. Start the backend server (in backend directory):
   ```bash
   npm run dev
   ```

2. In a new terminal, start the frontend server (in frontend directory):
   ```bash
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### 6. Default Login Credentials
After running the seed script, you can log in with these accounts:

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

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check if database name is 'lms'
   - Ensure password in `.env` matches your PostgreSQL password
   - Try connecting manually: `psql -U postgres -d lms`

2. **Port Already in Use**
   - Backend (5000): Check if another process is using port 5000
   - Frontend (3000): Next.js will automatically use next available port

3. **Prisma Issues**
   - Run `npx prisma generate` after any schema changes
   - For migration issues: `npx prisma migrate reset`

4. **Module Not Found Errors**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

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

### User Management Routes
```
GET /api/users/profile - Get user profile
PUT /api/users/profile - Update user profile
PUT /api/users/password - Change password
```

### Dashboard Routes
```
GET /api/dashboard/stats - Get dashboard statistics
GET /api/dashboard/recent-activities - Get recent activities
```

## Project Structure
```
lmsbase/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts         # Seed data
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── routes/        # API routes
│   │   ├── models/        # Data models
│   │   └── server.ts      # Main server file
│   └── .env               # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   └── lib/         # Utilities
│   └── .env.local       # Frontend environment variables
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 