# Learning Management System (LMS)

A modern, full-stack Learning Management System built with Node.js, Express, React, and PostgreSQL.

## Features

### User Management
- **Role-based Access Control**: Admin, Teacher, and Student roles
- **User Registration**: Email-based registration with role selection
- **Admin Approval**: New users require admin approval before accessing the system
- **User Authentication**: Secure authentication using JWT tokens

### Admin Dashboard
- **User Statistics**: Visual representation of user distribution by role and status
- **User Management**: View, approve, reject, and delete users
- **Dashboard Analytics**: Track the number of students, teachers, and pending approvals

### Teacher Features (Coming Soon)
- Class creation and management
- Course material uploads
- Student enrollment management
- Assignment creation and grading

### Student Features (Coming Soon)
- Class enrollment
- Access to course materials
- Assignment submission
- Progress tracking

## Tech Stack

### Backend
- **Node.js & Express**: Server framework
- **PostgreSQL**: Database
- **Prisma**: ORM for database interactions
- **JWT**: Authentication
- **bcrypt**: Password hashing

### Frontend
- **React**: UI library
- **Next.js**: React framework
- **Tailwind CSS**: Styling

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Setup Instructions

#### 1. Clone the repository
```bash
git clone https://github.com/PrankurShukla/LMS_MVC.git
cd LMS_MVC
```

#### 2. Database Setup
```bash
# Create the database
createdb lms_db
```

#### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables - create a .env file with:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db"
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000

# Run Prisma migrations
npx prisma migrate dev

# Seed the database with a default admin user
npx prisma db seed

# Start the backend server
npm run dev
```

#### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend server
npm run dev
```

#### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Admin Credentials
- Email: admin@lms.com
- Password: admin123

## API Documentation

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and receive JWT token
- `GET /api/auth/me`: Get current user information

### Admin Routes
- `GET /api/admin/users`: Get all users
- `GET /api/admin/pending-users`: Get users with pending status
- `PUT /api/admin/users/:id/status`: Update user status (approve/reject)
- `DELETE /api/admin/users/:id`: Delete a user

## Project Structure

```
lmsbase/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── models/
│   │   │   └── user.ts
│   │   ├── routes/
│   │   │   ├── admin.routes.ts
│   │   │   └── auth.routes.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   └── dashboard/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── student/
│   │   │   │   └── dashboard/
│   │   │   └── teacher/
│   │   │       └── dashboard/
│   │   ├── components/
│   │   │   └── DashboardHeader.tsx
│   └── package.json
└── README.md
```

## Screenshots

(Add screenshots here when available)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for development assistance
- The countless open-source libraries that made this project possible 