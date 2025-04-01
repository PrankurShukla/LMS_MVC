# Learning Management System (LMS)

A full-stack application for managing online courses, student enrollments, assignments, and learning materials.

## What is this project?

This is a Learning Management System (LMS) that allows:
- Teachers to create and manage online classes
- Students to enroll in classes and submit assignments
- Admins to manage users and monitor the system

## What you need to install first

1. **Node.js**
   - Go to [Node.js website](https://nodejs.org/)
   - Download and install the "LTS" (Long Term Support) version
   - To verify installation, open Command Prompt/Terminal and type:
     ```bash
     node --version
     npm --version
     ```
   - Both commands should show version numbers

2. **PostgreSQL**
   - Go to [PostgreSQL website](https://www.postgresql.org/download/)
   - Download and install PostgreSQL for your operating system
   - During installation:
     - Remember the password you set for the 'postgres' user
     - Keep the default port (5432)
   - To verify installation, open Command Prompt/Terminal and type:
     ```bash
     psql --version
     ```

3. **Git**
   - Go to [Git website](https://git-scm.com/downloads)
   - Download and install Git for your operating system
   - To verify installation, open Command Prompt/Terminal and type:
     ```bash
     git --version
     ```

## Step-by-Step Installation Guide

### Step 1: Set up the Database

#### For Windows:
1. Open Command Prompt as Administrator
2. Type these commands:
   ```bash
   psql -U postgres
   ```
3. Enter your PostgreSQL password when asked
4. Then type:
   ```sql
   CREATE DATABASE lms;
   \q
   ```

#### For macOS:
1. Open Terminal
2. Type these commands:
   ```bash
   brew install postgresql
   brew services start postgresql
   psql postgres
   ```
3. Then type:
   ```sql
   CREATE DATABASE lms;
   \q
   ```

#### For Linux (Ubuntu/Debian):
1. Open Terminal
2. Type these commands:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   sudo -u postgres psql
   ```
3. Then type:
   ```sql
   CREATE DATABASE lms;
   \q
   ```

### Step 2: Get the Project Files

1. Open Command Prompt/Terminal
2. Go to where you want to install the project (e.g., Desktop)
3. Type these commands:
   ```bash
   git clone https://github.com/PrankurShukla/LMS_MVC.git
   cd LMS_MVC
   ```

### Step 3: Set up the Backend

1. Open Command Prompt/Terminal
2. Go to the backend folder:
   ```bash
   cd backend
   ```
3. Install required packages:
   ```bash
   npm install
   ```
4. Create a file named `.env` in the backend folder with this exact content:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_db"

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

5. Set up the database:
   ```bash
   npx prisma migrate dev
   ```
6. Add some test data (optional):
   ```bash
   npx prisma db seed
   ```

### Step 4: Set up the Frontend

1. Open a new Command Prompt/Terminal
2. Go to the frontend folder:
   ```bash
   cd frontend
   ```
3. Install required packages:
   ```bash
   npm install
   ```
4. Create a file named `.env.local` in the frontend folder with this exact content:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### Step 5: Start the Application

1. Start the Backend:
   - Open Command Prompt/Terminal
   - Go to the backend folder:
     ```bash
     cd backend
     ```
   - Start the server:
     ```bash
     npm run dev
     ```
   - Keep this window open

2. Start the Frontend:
   - Open a new Command Prompt/Terminal
   - Go to the frontend folder:
     ```bash
     cd frontend
     ```
   - Start the server:
     ```bash
     npm run dev
     ```
   - Keep this window open

3. Access the Application:
   - Open your web browser
   - Go to: http://localhost:3000

## Using the Application

### First Time Setup

1. Register as an Admin:
   - Go to http://localhost:3000/register
   - Fill in your details
   - Select "admin" as your role
   - Click Register

2. Register as a Teacher:
   - Go to http://localhost:3000/register
   - Fill in your details
   - Select "teacher" as your role
   - Click Register
   - Wait for admin approval

3. Register as a Student:
   - Go to http://localhost:3000/register
   - Fill in your details
   - Select "student" as your role
   - Click Register
   - Wait for admin approval

### Common Problems and Solutions

1. **Can't connect to database?**
   - Make sure PostgreSQL is running
   - Check if your password in `.env` file is correct
   - Try running `npx prisma db pull` in the backend folder

2. **Frontend can't connect to backend?**
   - Make sure both servers are running
   - Check if the URL in `.env.local` is correct
   - Look for errors in your browser's console (F12)

3. **Port already in use?**
   - Close other applications that might be using ports 3000 or 5000
   - Or change the ports in the `.env` files

4. **Command not found?**
   - Make sure you've installed Node.js and PostgreSQL
   - Try closing and reopening your Command Prompt/Terminal

## Need Help?

If you encounter any issues:
1. Check the error messages in your Command Prompt/Terminal
2. Look for error messages in your browser's console (F12)
3. Make sure all prerequisites are installed correctly
4. Verify that all environment variables are set correctly

## Support

For additional help or to report issues, please create an issue in the GitHub repository.

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