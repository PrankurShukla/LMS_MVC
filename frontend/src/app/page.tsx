'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to Learning Management System
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              A modern platform for managing your educational journey. Empower your learning experience with our comprehensive tools and features.
            </p>
            <div className="space-x-4">
              <Link
                href="/login"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                Register
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-gray-600">Everything you need to manage your educational institution</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div 
              className="p-6 bg-gray-50 rounded-xl shadow-md"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
            >
              <div className="text-blue-600 text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Course Management</h3>
              <p className="text-gray-600">Easily create and manage courses, assignments, and materials</p>
            </motion.div>
            <motion.div 
              className="p-6 bg-gray-50 rounded-xl shadow-md"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
            >
              <div className="text-green-600 text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Student Enrollment</h3>
              <p className="text-gray-600">Streamlined enrollment process with approval system</p>
            </motion.div>
            <motion.div 
              className="p-6 bg-gray-50 rounded-xl shadow-md"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
            >
              <div className="text-purple-600 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-600">Monitor student progress and generate reports</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it Works</h2>
            <p className="text-gray-600">Get started in three simple steps</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div 
              className="text-center"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl text-blue-600 mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600">Sign up as a teacher or student</p>
            </motion.div>
            <motion.div 
              className="text-center"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl text-green-600 mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Set Up Classes</h3>
              <p className="text-gray-600">Create or join classes</p>
            </motion.div>
            <motion.div 
              className="text-center"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl text-purple-600 mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Start Learning</h3>
              <p className="text-gray-600">Access materials and track progress</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4">LMS Platform</h3>
              <p className="text-gray-400">Empowering education through technology</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">Course Management</li>
                <li className="text-gray-400">Student Enrollment</li>
                <li className="text-gray-400">Progress Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">support@lms-platform.com</p>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} LMS Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
