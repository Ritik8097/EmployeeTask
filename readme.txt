// server.js - Main application file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const departmentRoutes = require('./routes/departments');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/departments', departmentRoutes);

// Error handling middleware
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// .env file
/*
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-tracker
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
*/

// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Review', 'Done'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);

// models/Department.js
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a department name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Department name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Department', DepartmentSchema);

// middleware/auth.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// middleware/errorHandler.js
const ErrorResponse = require('../utils/errorResponse');

exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.log(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

// utils/asyncHandler.js
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

// utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;

// controllers/auth.js
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    department
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const responseData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    token
  };

  res.status(statusCode).json(responseData);
};

// controllers/tasks.js
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Task = require('../models/Task');
const User = require('../models/User');
const ExcelJS = require('exceljs');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin
exports.getTasks = asyncHandler(async (req, res, next) => {
  const tasks = await Task.find().populate({
    path: 'employeeId',
    select: 'name department',
    model: User
  });

  // Transform data to match frontend expectations
  const transformedTasks = tasks.map(task => ({
    _id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    employee: {
      _id: task.employeeId._id,
      name: task.employeeId.name,
      department: task.employeeId.department
    }
  }));

  res.status(200).json(transformedTasks);
});

// @desc    Get tasks for a specific employee
// @route   GET /api/tasks/employee/:id
// @access  Private
exports.getEmployeeTasks = asyncHandler(async (req, res, next) => {
  // Make sure employee exists
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`No user with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to view these tasks
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return next(new ErrorResponse('Not authorized to access these tasks', 401));
  }

  const tasks = await Task.find({ employeeId: req.params.id });

  res.status(200).json(tasks);
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate({
    path: 'employeeId',
    select: 'name department',
    model: User
  });

  if (!task) {
    return next(new ErrorResponse(`No task with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to view the task
  if (req.user.role !== 'admin' && req.user.id !== task.employeeId.toString()) {
    return next(new ErrorResponse('Not authorized to access this task', 401));
  }

  res.status(200).json(task);
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.employeeId = req.body.employeeId || req.user.id;

  // Make sure user is authorized to create tasks for this employee
  if (req.user.role !== 'admin' && req.user.id !== req.body.employeeId) {
    return next(new ErrorResponse('Not authorized to create tasks for other employees', 401));
  }

  const task = await Task.create(req.body);

  res.status(201).json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`No task with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to update the task
  if (req.user.role !== 'admin' && req.user.id !== task.employeeId.toString()) {
    return next(new ErrorResponse('Not authorized to update this task', 401));
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(task);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`No task with the id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to delete the task
  if (req.user.role !== 'admin' && req.user.id !== task.employeeId.toString()) {
    return next(new ErrorResponse('Not authorized to delete this task', 401));
  }

  await task.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Export tasks to Excel
// @route   GET /api/tasks/export
// @access  Private/Admin
exports.exportTasks = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to export tasks', 401));
  }

  // Set query for department filter
  let query = {};
  if (req.query.department && req.query.department !== 'all') {
    // Get employee IDs for this department
    const employees = await User.find({ department: req.query.department }).select('_id');
    const employeeIds = employees.map(emp => emp._id);
    query = { employeeId: { $in: employeeIds } };
  }

  // Get tasks with employee details
  const tasks = await Task.find(query).populate({
    path: 'employeeId',
    select: 'name department',
    model: User
  });

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Add headers
  worksheet.columns = [
    { header: 'Task ID', key: 'id', width: 26 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 20 }
  ];

  // Add task data
  tasks.forEach(task => {
    worksheet.addRow({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set',
      employee: task.employeeId.name,
      department: task.employeeId.department,
      createdAt: new Date(task.createdAt).toLocaleDateString()
    });
  });

  // Style headers
  worksheet.getRow(1).font = { bold: true };

  // Set content type and disposition
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=tasks-${new Date().toISOString().slice(0,10)}.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
});

// controllers/departments.js
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res, next) => {
  const departments = await Department.find();

  res.status(200).json(departments);
});

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`No department with the id of ${req.params.id}`, 404));
  }

  res.status(200).json(department);
});

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to create departments', 401));
  }

  const department = await Department.create(req.body);

  res.status(201).json(department);
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update departments', 401));
  }

  let department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`No department with the id of ${req.params.id}`, 404));
  }

  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(department);
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete departments', 401));
  }

  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`No department with the id of ${req.params.id}`, 404));
  }

  await department.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;

// routes/tasks.js
const express = require('express');
const { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask, 
  getEmployeeTasks,
  exportTasks 
} = require('../controllers/tasks');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(authorize('admin'), getTasks)
  .post(createTask);

router.route('/export')
  .get(authorize('admin'), exportTasks);

router.route('/employee/:id')
  .get(getEmployeeTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;

// routes/departments.js
const express = require('express');
const { 
  getDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} = require('../controllers/departments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(getDepartments)
  .post(authorize('admin'), createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(authorize('admin'), updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

module.exports = router;

// seed.js - Seed data script
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Task = require('./models/Task');
const Department = require('./models/Department');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Task.deleteMany();
    await Department.deleteMany();

    console.log('Data cleared...');

    // Create departments
    const departments = await Department.create([
      {
        name: 'Engineering',
        description: 'Software development and engineering'
      },
      {
        name: 'Marketing',
        description: 'Marketing and communications'
      },
      {
        name: 'Sales',
        description: 'Sales and customer relationships'
      },
      {
        name: 'Finance',
        description: 'Financial operations and accounting'
      },
      {
        name: 'HR',
        description: 'Human resources and personnel management'
      }
    ]);

    console.log('Departments created...');

    // Create users (including admin)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      department: 'Management'
    });

    const engineer1 = await User.create({
      name: 'John Developer',
      email: 'john@example.com',
      password: 'password123',
      department: 'Engineering'
    });

    const marketer1 = await User.create({
      name: 'Sarah Marketer',
      email: 'sarah@example.com',
      password: 'password123',
      department: 'Marketing'
    });

    const sales1 = await User.create({
      name: 'Mike Sales',
      email: 'mike@example.com',
      password: 'password123',
      department: 'Sales'
    });

    console.log('Users created...');

    // Create tasks
    await Task.create([
      {
        title: 'Develop API endpoints',
        description: 'Create REST API endpoints for the task manager',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date('2025-05-05'),
        employeeId: engineer1._id
      },
      {
        title: 'Fix frontend bugs',
        description: 'Address UI issues in the dashboard',
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date('2025-05-10'),
        employeeId: engineer1._id
      },
      {
        title: 'Create marketing campaign',
        description: 'Develop Q2 marketing campaign for new product launch',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date('2025-05-15'),
        employeeId: marketer1._id
      },
      {
        title: 'Contact new leads',
        description: 'Reach out to potential customers from the trade show',
        status: 'To Do',
        priority: 'Urgent',
        dueDate: new Date('2025-04-25'),
        employeeId: sales1._id
      },
      {
        title: 'Prepare sales report',
        description: 'Compile Q1 sales figures for management review',
        status: 'Done',
        priority: 'Medium',
        dueDate: new Date('2025-04-10'),
        employeeId: sales1._id
      }
    ]);

    console.log('Tasks created...');
    console.log('Seeding completed!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
seedData();

// package.json
{
  "name": "task-tracker-backend",
  "version": "1.0.0",
  "description": "Backend API for the Employee Task Tracker application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "exceljs": "^4.4.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}