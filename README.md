# Learning Management System (LMS)

A modern Learning Management System built with Next.js 15, Express.js 5, and PostgreSQL. This system facilitates online education by managing classes, enrollments, course materials, and assignments.

## Tech Stack Versions

### Backend
- Node.js (v16+)
- Express.js 5.1.0
- TypeScript 5.8.2
- Prisma 6.5.0
- PostgreSQL 12+
- JWT 9.0.2

### Frontend
- Next.js 15.2.4
- React 19.0.0
- TypeScript 5
- Tailwind CSS 4
- React Hot Toast 2.5.2

## Features

### User Management
- **Role-Based Access Control**
  - Admin: Full system access, user management
  - Teacher: Class management, material creation, grading
  - Student: Course access, assignment submission
- **Authentication System**
  - Secure JWT-based authentication
  - Password hashing with bcryptjs
  - Role-based route protection
- **User Registration & Approval**
  - Student self-registration
  - Admin approval workflow
  - Email-based account verification

### Class Management
- **Class Creation & Management**
  - Teachers can create and manage classes
  - Detailed class descriptions and settings
  - Class status tracking
- **Enrollment System**
  - Student enrollment requests
  - Teacher approval/rejection
  - Enrollment status tracking
- **Course Materials**
  - Rich text content support
  - Organized by class and topic

### Assignment System
- **Assignment Management**
  - Create assignments with due dates
  - Detailed instructions and requirements
- **Submission System**
  - Student assignment submission
  - Submission status tracking
- **Grading & Feedback**
  - Teacher grading interface
  - Detailed feedback system
  - Grade tracking and history

### Additional Features
- **Real-time Updates**
  - Live notifications for new assignments
  - Grade updates
  - Enrollment status changes
- **Responsive Design**
  - Mobile-friendly interface
  - Adaptive layouts
  - Touch-friendly controls
- **Security Features**
  - CSRF protection
  - Rate limiting
  - Input validation
  - Secure file handling

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js and npm**
   - Download from [Node.js website](https://nodejs.org/)
   - Choose the LTS (Long Term Support) version
   - Verify installation:
     ```bash
     node --version  # Should show v16.x or higher
     npm --version   # Should show 7.x or higher
     ```

2. **PostgreSQL**
   - Download from [PostgreSQL website](https://www.postgresql.org/download/)
   - During installation:
     - Remember the password you set for the 'postgres' user
     - Keep the default port (5432)
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

## Step-by-Step Setup Guide

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/PrankurShukla/LMS_MVC.git

# Navigate to the project directory
cd LMS_MVC
```

### 2. Set Up the Database

1. **Create a PostgreSQL Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create the database
   CREATE DATABASE lms_db;

   # Exit PostgreSQL
   \q
   ```

2. **Set Up Backend Environment**
   ```bash
   # Navigate to backend directory
   cd backend

   # Create .env file
   touch .env
   ```

   Add the following to `backend/.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/lms_db"

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

3. **Install Backend Dependencies**
   ```bash
   # Install dependencies
   npm install

   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed the database with initial data
   npx prisma db seed
   ```

### 3. Set Up Frontend

1. **Set Up Frontend Environment**
   ```bash
   # Navigate to frontend directory
   cd ../frontend

   # Create .env.local file
   touch .env.local
   ```

   Add the following to `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

2. **Install Frontend Dependencies**
   ```bash
   # Install dependencies
   npm install
   ```

### 4. Start the Application

1. **Start Backend Server**
   ```bash
   # From the backend directory
   cd backend
   npm run dev
   ```

2. **Start Frontend Server**
   ```bash
   # From the frontend directory
   cd frontend
   npm run dev
   ```

   Or use the provided scripts:
   - Windows (PowerShell):
     ```bash
     ./start-servers.ps1
     ```
   - Linux/Mac:
     ```bash
     ./start-servers.sh
     ```

### 5. Access the Application

- Open your browser and go to: `http://localhost:3000`
- Use the following default credentials to log in:

  **Admin Account:**
  - Email: admin@lms.com
  - Password: admin123

  **Teacher Account:**
  - Email: teacher@lms.com
  - Password: teacher123

  **Student Account:**
  - Email: student@lms.com
  - Password: student123

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check if the password in `.env` matches your PostgreSQL password
   - Ensure the database name matches what you created

2. **Port Conflicts**
   - If port 5000 is in use, change `PORT` in `backend/.env`
   - If port 3000 is in use, Next.js will automatically use the next available port

3. **Installation Errors**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **Prisma Issues**
   - Run `npx prisma generate` after any schema changes
   - If migrations fail, try `npx prisma migrate reset`

## Project Structure

```
lmsbase/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts         # Database seeding script
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── class.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/     # Custom middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── roles.ts
│   │   ├── models/        # Data models
│   │   │   ├── user.ts
│   │   │   ├── class.ts
│   │   │   └── enrollment.ts
│   │   ├── routes/        # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── class.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── lib/           # Utilities
│   │   │   ├── prisma.ts
│   │   │   └── jwt.ts
│   │   └── server.ts      # Main server file
│   └── .env               # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   │   ├── (auth)/   # Authentication pages
│   │   │   ├── (dashboard)/ # Dashboard pages
│   │   │   └── layout.tsx
│   │   ├── components/   # React components
│   │   │   ├── ui/      # UI components
│   │   │   └── shared/  # Shared components
│   │   └── lib/         # Utilities
│   └── .env.local        # Frontend environment
│
└── start-servers.ps1     # Server startup script
```

## API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user's profile

### Admin Routes
- `GET /api/admin/pending-users` - Get all pending users
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status (approve/reject)
- `DELETE /api/admin/users/:id` - Delete user

### Class Management Routes
- `POST /api/classes` - Create a class (teachers only)
- `PUT /api/classes/:id` - Update a class
- `DELETE /api/classes/:id` - Delete a class
- `GET /api/classes/:id` - Get a class by ID
- `GET /api/classes/teacher/my-classes` - Get classes by logged in teacher
- `GET /api/classes` - Get all classes

### Enrollment Routes
- `POST /api/classes/enroll` - Request enrollment (students only)
- `PUT /api/classes/enrollments/:id/status` - Update enrollment status (teachers only)
- `GET /api/classes/:classId/enrollments` - Get all enrollments for a class
- `GET /api/classes/:classId/enrollments/pending` - Get pending enrollments
- `GET /api/classes/student/my-enrollments` - Get student enrollments

### Course Material Routes
- `POST /api/classes/materials` - Create course material (teachers only)
- `PUT /api/classes/materials/:id` - Update course material
- `DELETE /api/classes/materials/:id` - Delete course material
- `GET /api/classes/:classId/materials` - Get materials for a class

### Assignment Routes
- `POST /api/classes/assignments` - Create assignment (teachers only)
- `PUT /api/classes/assignments/:id` - Update assignment
- `DELETE /api/classes/assignments/:id` - Delete assignment
- `GET /api/classes/:classId/assignments` - Get assignments for a class
- `GET /api/classes/assignments/:id` - Get assignment by ID

### Assignment Submission Routes
- `POST /api/classes/assignments/submit` - Submit assignment (students only)
- `PUT /api/classes/submissions/:id/grade` - Grade submission (teachers only)
- `GET /api/classes/assignments/:assignmentId/submissions` - Get submissions for an assignment
- `GET /api/classes/student/submissions` - Get student submissions
- `GET /api/classes/assignments/:assignmentId/my-submission` - Get specific student submission

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [shuklaprankur27@gmail.com] 