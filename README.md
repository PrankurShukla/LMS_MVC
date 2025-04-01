# Learning Management System (LMS)

A full-stack Learning Management System built with Next.js, Node.js, and PostgreSQL.

## Features

- User Authentication (Admin, Teacher, Student roles)
- Class Management
- Course Material Management
- Assignment Management
- Enrollment System
- Real-time Updates
- Responsive Design

## Tech Stack

- **Frontend**: Next.js 13+, React, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

## Directory Structure

```
lmsbase/
├── backend/                 # Backend server
│   ├── prisma/             # Database schema and migrations
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── lib/          # Utilities and configurations
│   └── .env              # Backend environment variables
│
└── frontend/              # Frontend application
    ├── src/
    │   ├── app/          # Next.js pages and routing
    │   ├── components/   # Reusable React components
    │   └── styles/       # Global styles
    └── .env.local        # Frontend environment variables
```

## Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Environment Setup

1. Backend Environment (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms"

# JWT Configuration
JWT_SECRET="your-secret-key-here"

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

2. Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation Steps

1. Clone the repository
```bash
git clone https://github.com/PrankurShukla/LMS_MVC.git
cd LMS_MVC
```

2. Install Backend Dependencies
```bash
cd backend
npm install
```

3. Set up the Database
```bash
# Create database tables
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

4. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

5. Start the Application
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

## Default Users

After seeding the database, you can log in with these default accounts:

1. Admin Account
   - Email: admin@lms.com
   - Password: admin123

2. Teacher Account
   - Email: teacher@lms.com
   - Password: teacher123

## Application Workflow

1. **User Authentication**
   - Users can register as students
   - Admins can approve/reject user registrations
   - Teachers are created by admins

2. **Class Management (Teachers)**
   - Create and manage classes
   - Add course materials
   - Create assignments
   - Review and grade submissions
   - Manage student enrollments

3. **Student Experience**
   - Browse available classes
   - Request enrollment in classes
   - Access course materials
   - Submit assignments
   - View grades and feedback

## API Documentation

### Authentication Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/verify - Verify JWT token

### Class Management Endpoints
- GET /api/classes - Get all classes
- POST /api/classes - Create new class
- GET /api/classes/:id - Get class details
- PUT /api/classes/:id - Update class
- DELETE /api/classes/:id - Delete class

### Enrollment Endpoints
- POST /api/classes/enroll - Request enrollment
- GET /api/classes/:id/enrollments - Get class enrollments
- PUT /api/classes/enrollments/:id/status - Update enrollment status

## Contributing Guidelines

1. **Fork the Repository**
   - Create a fork of this repository
   - Clone your fork locally

2. **Create a Branch**
   - Create a new branch for your feature/fix
   - Use descriptive branch names (e.g., feature/add-zoom-integration)

3. **Code Style**
   - Follow existing code style and conventions
   - Use meaningful variable and function names
   - Add comments for complex logic

4. **Testing**
   - Test your changes thoroughly
   - Ensure existing features still work
   - Add new tests if necessary

5. **Commit Guidelines**
   - Write clear commit messages
   - Keep commits focused and atomic
   - Reference issue numbers in commits

6. **Pull Request Process**
   - Create a pull request to the main branch
   - Provide a clear description of changes
   - Include screenshots for UI changes
   - Respond to review comments

## Troubleshooting

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

2. **Authentication Issues**
   - Check JWT_SECRET in .env
   - Verify token expiration
   - Clear browser storage

3. **Build Errors**
   - Delete node_modules and reinstall
   - Clear Next.js cache
   - Update dependencies

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [your-email@example.com] 