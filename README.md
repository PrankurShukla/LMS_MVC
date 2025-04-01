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

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or later)
- PostgreSQL (v12 or later)
- npm or yarn
- Git

## Environment Setup

### 1. Database Setup

#### Windows
1. Download and install PostgreSQL from [the official website](https://www.postgresql.org/download/windows/)
2. During installation:
   - Set a password for the 'postgres' user
   - Keep the default port (5432)
3. After installation, create the database:
   ```powershell
   # Open Command Prompt as administrator
   psql -U postgres
   # Enter your password when prompted
   CREATE DATABASE lms;
   \q
   ```

#### macOS
1. Install PostgreSQL using Homebrew:
   ```bash
   brew install postgresql
   brew services start postgresql
   ```
2. Create the database:
   ```bash
   psql postgres
   CREATE DATABASE lms;
   \q
   ```

#### Linux (Ubuntu/Debian)
1. Install PostgreSQL:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```
2. Create the database:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE lms;
   \q
   ```

### 2. Project Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PrankurShukla/LMS_MVC.git
   cd LMS_MVC
   ```

2. Backend Setup:
   ```bash
   # Navigate to backend directory
   cd backend

   # Install dependencies
   npm install

   # Create .env file
   echo "DATABASE_URL=\"postgresql://postgres:your_password@localhost:5432/lms?schema=public\"
   JWT_SECRET=\"your-secret-key\"
   PORT=5000" > .env

   # Run database migrations
   npx prisma migrate dev

   # Seed the database (optional)
   npx prisma db seed
   ```

3. Frontend Setup:
   ```bash
   # Navigate to frontend directory
   cd ../frontend

   # Install dependencies
   npm install

   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=\"http://localhost:5000\"" > .env.local
   ```

## Running the Application

### Windows (PowerShell)

1. Start the backend server:
   ```powershell
   cd backend
   npm run dev
   ```

2. In a new PowerShell window, start the frontend server:
   ```powershell
   cd frontend
   npm run dev
   ```

### macOS/Linux

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal window, start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

### Using Start Scripts

#### Windows
```powershell
# From project root
.\start-servers.ps1
```

#### macOS/Linux
```bash
# Make the script executable
chmod +x start-servers.sh

# Run the script
./start-servers.sh
```

## Accessing the Application

1. Frontend: http://localhost:3000
2. Backend API: http://localhost:5000

## User Roles

### Admin
- Manage user accounts
- Approve/reject user registrations
- Monitor system activity

### Teacher
- Create and manage classes
- Add course materials
- Create assignments
- Grade submissions
- Manage enrollments

### Student
- View available classes
- Request enrollment
- Access course materials
- Submit assignments
- View grades

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

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Run `npx prisma db pull` to verify connection

2. **API Connection Errors**
   - Ensure backend server is running
   - Verify NEXT_PUBLIC_API_URL is correct in frontend .env.local
   - Check browser console for CORS errors

3. **Port Conflicts**
   - Ensure no other application is using port 5000 (backend) or 3000 (frontend)
   - Change ports in respective .env files if needed

4. **PowerShell Command Issues**
   - Use semicolons (`;`) instead of ampersands (`&&`) to chain commands
   - Run each command separately to isolate issues

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 