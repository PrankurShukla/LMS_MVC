# Learning Management System (LMS)

A modern Learning Management System built with Next.js 13, Express.js, and PostgreSQL. This system facilitates online education by managing classes, enrollments, course materials, and assignments.

## Features

- **User Management**
  - Role-based authentication (Admin, Teacher, Student)
  - User registration with admin approval system
  - Secure password handling and JWT authentication

- **Class Management**
  - Teachers can create and manage classes
  - Detailed class descriptions and materials
  - Student enrollment system with approval workflow

- **Course Materials**
  - Upload and manage course materials
  - Organized content per class
  - Easy access for enrolled students

- **Assignment System**
  - Create and manage assignments with due dates
  - Student submission system
  - Grading and feedback functionality

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM for database management
- PostgreSQL database
- JWT for authentication

### Frontend
- Next.js 13 with App Router
- TypeScript
- Tailwind CSS for styling
- React Query for state management

## Project Structure

```
lmsbase/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── lib/           # Utilities
│   │   └── server.ts      # Main server file
│   └── .env               # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   └── components/   # React components
│   └── .env.local        # Frontend environment
│
└── start-servers.ps1     # Server startup script
```

## Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

## Environment Setup

1. Backend Environment (backend/.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/lms_db"

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

2. Frontend Environment (frontend/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation

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

3. Set up Database
```bash
npx prisma migrate dev
npx prisma db seed
```

4. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

5. Start the Application
- Windows (PowerShell):
```bash
./start-servers.ps1
```
- Linux/Mac:
```bash
./start-servers.sh
```

## Default Users

After seeding the database, you can log in with these accounts:

1. Admin:
   - Email: admin@lms.com
   - Password: admin123

2. Teacher:
   - Email: teacher@lms.com
   - Password: teacher123

3. Student:
   - Email: student@lms.com
   - Password: student123

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/verify - Verify JWT token

### Classes
- GET /api/classes - List all classes
- POST /api/classes - Create new class
- GET /api/classes/:id - Get class details
- PUT /api/classes/:id - Update class
- DELETE /api/classes/:id - Delete class

### Enrollments
- POST /api/enrollments - Request enrollment
- PUT /api/enrollments/:id - Update enrollment status
- GET /api/enrollments/class/:id - Get class enrollments
- GET /api/enrollments/student - Get student enrollments

### Course Materials
- POST /api/materials - Add course material
- GET /api/materials/class/:id - Get class materials
- PUT /api/materials/:id - Update material
- DELETE /api/materials/:id - Delete material

### Assignments
- POST /api/assignments - Create assignment
- GET /api/assignments/class/:id - Get class assignments
- POST /api/assignments/:id/submit - Submit assignment
- PUT /api/assignments/:id/grade - Grade submission

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