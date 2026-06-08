require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');

// Models
const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Payroll = require('./models/Payroll');
const Performance = require('./models/Performance');
const JobPosting = require('./models/JobPosting');

// Firebase Admin init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const DEMO_USERS = [
  { email: 'admin@hireflow.com', password: 'demo1234', role: 'admin', name: 'Alex Admin' },
  { email: 'manager@hireflow.com', password: 'demo1234', role: 'manager', name: 'Maria Manager' },
  { email: 'hr@hireflow.com', password: 'demo1234', role: 'hr', name: 'Henry HR' },
  { email: 'employee@hireflow.com', password: 'demo1234', role: 'employee', name: 'Emma Employee' },
];

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
const DESIGNATIONS = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'DevOps Engineer'],
  Marketing: ['Marketing Manager', 'Content Writer', 'SEO Specialist', 'Brand Manager'],
  Sales: ['Sales Executive', 'Account Manager', 'Business Dev Manager', 'Sales Lead'],
  HR: ['HR Manager', 'Recruiter', 'HR Business Partner', 'Talent Acquisition'],
  Finance: ['Financial Analyst', 'Accountant', 'CFO', 'Finance Manager'],
  Operations: ['Operations Manager', 'Project Manager', 'Business Analyst', 'Coordinator'],
};

const SAMPLE_EMPLOYEES = [
  { name: 'James Wilson', email: 'james.wilson@company.com', department: 'Engineering', designation: 'Software Engineer', salary: 85000, phone: '+1-555-0101', manager: 'Maria Manager' },
  { name: 'Sarah Chen', email: 'sarah.chen@company.com', department: 'Engineering', designation: 'Senior Engineer', salary: 105000, phone: '+1-555-0102', manager: 'Maria Manager' },
  { name: 'Michael Brown', email: 'michael.brown@company.com', department: 'Marketing', designation: 'Marketing Manager', salary: 78000, phone: '+1-555-0103', manager: 'Maria Manager' },
  { name: 'Emily Davis', email: 'emily.davis@company.com', department: 'Sales', designation: 'Sales Executive', salary: 65000, phone: '+1-555-0104', manager: 'Maria Manager' },
  { name: 'David Martinez', email: 'david.martinez@company.com', department: 'HR', designation: 'HR Manager', salary: 72000, phone: '+1-555-0105', manager: 'Alex Admin' },
  { name: 'Jessica Taylor', email: 'jessica.taylor@company.com', department: 'Finance', designation: 'Financial Analyst', salary: 80000, phone: '+1-555-0106', manager: 'Alex Admin' },
  { name: 'Robert Anderson', email: 'robert.anderson@company.com', department: 'Engineering', designation: 'Tech Lead', salary: 120000, phone: '+1-555-0107', manager: 'Maria Manager' },
  { name: 'Lisa Thomas', email: 'lisa.thomas@company.com', department: 'Operations', designation: 'Project Manager', salary: 90000, phone: '+1-555-0108', manager: 'Maria Manager' },
  { name: 'Kevin Jackson', email: 'kevin.jackson@company.com', department: 'Marketing', designation: 'Content Writer', salary: 55000, phone: '+1-555-0109', manager: 'Michael Brown' },
  { name: 'Amanda White', email: 'amanda.white@company.com', department: 'Sales', designation: 'Account Manager', salary: 70000, phone: '+1-555-0110', manager: 'Emily Davis' },
];

const RESUME_TEXTS = [
  `John Doe - Software Engineer
Experience: 5 years at TechCorp as Full Stack Developer. Skills: React, Node.js, MongoDB, AWS, Docker.
Education: BS Computer Science, State University 2018.
Projects: Built e-commerce platform serving 100K users. Led team of 5 engineers.`,
  `Jane Smith - Product Manager
Experience: 7 years in product management at StartupXYZ and BigCo.
Skills: Roadmap planning, stakeholder management, Agile, JIRA, data analysis.
Education: MBA, Business School 2016. BS Engineering 2014.
Achievements: Launched 3 products generating $2M ARR.`,
  `Bob Johnson - Marketing Specialist
Experience: 3 years at Marketing Agency. Skills: SEO, Google Ads, social media, content creation, HubSpot.
Education: BA Marketing, City College 2020.
Portfolio: Managed $500K ad budget, increased organic traffic by 150%.`,
  `Alice Brown - Data Scientist
Experience: 4 years at DataCo. Skills: Python, TensorFlow, SQL, Tableau, machine learning, statistics.
Education: MS Data Science, Tech University 2019.
Projects: Built churn prediction model with 92% accuracy, saving $1M annually.`,
  `Charlie Wilson - DevOps Engineer
Experience: 6 years at CloudFirst. Skills: Kubernetes, Terraform, CI/CD, AWS, GCP, Linux, monitoring.
Education: BS Systems Engineering 2017.
Certifications: AWS Solutions Architect, CKA.`,
];

async function createFirebaseUser(userData) {
  try {
    const user = await admin.auth().getUserByEmail(userData.email);
    console.log(`  ✓ Firebase user exists: ${userData.email} (${user.uid})`);
    return user.uid;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true,
      });
      console.log(`  ✓ Created Firebase user: ${userData.email} (${newUser.uid})`);
      return newUser.uid;
    }
    throw err;
  }
}

async function seed() {
  console.log('\n🌱 HireFlow HRMS Seed Script Starting...\n');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Step 1: Create Firebase users and MongoDB User docs
  console.log('📋 Step 1: Creating demo Firebase users...');
  const userUids = {};
  for (const userData of DEMO_USERS) {
    const uid = await createFirebaseUser(userData);
    userUids[userData.role] = uid;
    await User.findOneAndUpdate(
      { uid },
      { uid, email: userData.email, role: userData.role, name: userData.name },
      { upsert: true, new: true }
    );
    console.log(`  ✓ MongoDB User: ${userData.name} (${userData.role})`);
  }
  console.log('');

  // Step 2: Clear existing data (optional - comment out to preserve)
  console.log('🗑️  Step 2: Clearing existing seeded data...');
  await Employee.deleteMany({});
  await Attendance.deleteMany({});
  await Payroll.deleteMany({});
  await Performance.deleteMany({});
  await JobPosting.deleteMany({});
  console.log('  ✓ Cleared employees, attendance, payroll, performance, job postings\n');

  // Step 3: Create employees
  console.log('👥 Step 3: Creating 10 sample employees...');
  const createdEmployees = [];
  for (let i = 0; i < SAMPLE_EMPLOYEES.length; i++) {
    const empData = SAMPLE_EMPLOYEES[i];
    const empId = `EMP${String(i + 1).padStart(3, '0')}`;
    const emp = await Employee.create({
      ...empData,
      employeeId: empId,
      joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    createdEmployees.push(emp);
    console.log(`  ✓ ${empId}: ${empData.name} (${empData.department})`);
  }
  console.log('');

  // Step 4: Create attendance records (current month)
  console.log('📅 Step 4: Creating attendance records for current month...');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  let attendanceCount = 0;
  const statuses = ['present', 'present', 'present', 'present', 'absent', 'half-day', 'leave'];

  for (const emp of createdEmployees) {
    for (let day = 1; day <= Math.min(today, daysInMonth); day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const checkIn = status === 'absent' ? null : `0${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
      const checkOut = status === 'absent' ? null : `${17 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
      const hoursWorked = status === 'present' ? (8 + Math.random() * 2) : status === 'half-day' ? 4 : 0;

      await Attendance.create({
        employeeId: emp.employeeId,
        date,
        checkIn,
        checkOut,
        status,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
      });
      attendanceCount++;
    }
  }
  console.log(`  ✓ Created ${attendanceCount} attendance records\n`);

  // Step 5: Create payroll records
  console.log('💰 Step 5: Creating payroll records...');
  const currentMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
  const prevMonth = month === 0
    ? `${year - 1}-12`
    : `${year}-${String(month).padStart(2, '0')}`;

  for (const emp of createdEmployees) {
    // Current month (pending)
    const allowances = Math.round(emp.salary * 0.2);
    const deductions = Math.round(emp.salary * 0.1);
    await Payroll.create({
      employeeId: emp.employeeId,
      month: currentMonth,
      basicSalary: emp.salary,
      allowances,
      deductions,
      netSalary: emp.salary + allowances - deductions,
      status: 'pending',
    });
    // Previous month (paid)
    await Payroll.create({
      employeeId: emp.employeeId,
      month: prevMonth,
      basicSalary: emp.salary,
      allowances,
      deductions,
      netSalary: emp.salary + allowances - deductions,
      status: 'paid',
      paidOn: new Date(year, month, 1),
    });
    console.log(`  ✓ Payroll for ${emp.name}: $${emp.salary.toLocaleString()}/mo`);
  }
  console.log('');

  // Step 6: Create performance reviews
  console.log('⭐ Step 6: Creating performance reviews...');
  const reviewData = [
    {
      employeeId: createdEmployees[0].employeeId,
      reviewPeriod: 'Q4 2025',
      rating: 4,
      goals: ['Complete microservices migration', 'Mentor junior developers', 'Improve test coverage to 80%'],
      achievements: ['Migrated 3 services to microservices architecture', 'Mentored 2 junior engineers', 'Test coverage increased from 45% to 78%'],
      managerNotes: 'James has shown exceptional technical leadership this quarter. His work on the microservices migration has been instrumental in improving system reliability.',
      aiSummary: 'James Wilson demonstrated outstanding technical performance in Q4 2025, achieving near-complete migration to microservices architecture ahead of schedule. His mentorship contributions and significant improvements to test coverage reflect strong leadership qualities and commitment to engineering excellence. Rating of 4/5 reflects consistent high performance with minor areas for continued growth.',
      reviewedBy: userUids.manager || 'system',
    },
    {
      employeeId: createdEmployees[2].employeeId,
      reviewPeriod: 'Q4 2025',
      rating: 5,
      goals: ['Launch Q4 campaign', 'Increase brand awareness by 30%', 'Build content calendar'],
      achievements: ['Successfully launched Q4 holiday campaign with 45% engagement increase', 'Brand awareness improved by 38%', 'Established 3-month content calendar'],
      managerNotes: 'Michael exceeded all targets this quarter. The holiday campaign was a massive success.',
      aiSummary: 'Michael Brown delivered an exceptional performance in Q4 2025, surpassing all established goals with remarkable results. The Q4 holiday campaign success and 38% brand awareness growth significantly exceeded targets. Michael\'s proactive approach to content planning demonstrates strategic thinking beyond expectations, earning a perfect 5/5 rating.',
      reviewedBy: userUids.manager || 'system',
    },
  ];

  for (const review of reviewData) {
    await Performance.create(review);
    console.log(`  ✓ Performance review for ${review.reviewPeriod}`);
  }
  console.log('');

  // Step 7: Create job postings with applicants
  console.log('📢 Step 7: Creating job postings with applicants...');
  const jobPostings = [
    {
      title: 'Senior Software Engineer',
      department: 'Engineering',
      description: 'We are looking for a Senior Software Engineer to join our growing engineering team. You will design, build, and maintain efficient, reusable, and reliable code.',
      requirements: ['5+ years of experience', 'Proficiency in React and Node.js', 'Experience with MongoDB and PostgreSQL', 'Strong problem-solving skills', 'Experience with cloud platforms (AWS/GCP)'],
      status: 'open',
    },
    {
      title: 'Product Marketing Manager',
      department: 'Marketing',
      description: 'Seeking an experienced Product Marketing Manager to drive our go-to-market strategy and product launches.',
      requirements: ['3+ years in product marketing', 'Experience with B2B SaaS products', 'Strong analytical skills', 'Excellent written communication', 'MBA preferred'],
      status: 'open',
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      description: 'Join our infrastructure team to build and maintain our cloud-native deployment pipelines and monitoring systems.',
      requirements: ['3+ years DevOps experience', 'Kubernetes and Docker expertise', 'CI/CD pipeline experience', 'AWS or GCP certification', 'Infrastructure as Code (Terraform)'],
      status: 'open',
    },
  ];

  const applicantNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
  const applicantEmails = ['john.doe@gmail.com', 'jane.smith@outlook.com', 'bob.j@yahoo.com', 'alice.b@gmail.com', 'charlie.w@proton.me'];
  const aiScores = [85, 72, 45, 91, 38];
  const recommendations = ['Strong Fit', 'Strong Fit', 'Moderate Fit', 'Strong Fit', 'Weak Fit'];

  for (const jobData of jobPostings) {
    const applicants = applicantNames.map((name, i) => ({
      name,
      email: applicantEmails[i],
      resumeText: RESUME_TEXTS[i],
      aiScore: aiScores[i],
      aiSummary: `${name} shows ${recommendations[i].toLowerCase()} for this role. Key strengths include relevant technical background and demonstrated project experience. ${aiScores[i] >= 70 ? 'Highly recommended for interview.' : aiScores[i] >= 40 ? 'Consider for phone screening.' : 'Does not meet minimum requirements.'}`,
      appliedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
    }));

    const job = await JobPosting.create({
      ...jobData,
      applicants,
      createdBy: userUids.hr || userUids.admin || 'system',
    });
    console.log(`  ✓ "${job.title}" — ${applicants.length} applicants`);
  }
  console.log('');

  console.log('🎉 Seed complete! Summary:');
  console.log('  - 4 Firebase Auth users created');
  console.log('  - 4 MongoDB User documents created');
  console.log(`  - 10 employees created`);
  console.log(`  - ${attendanceCount} attendance records created`);
  console.log('  - 20 payroll records created (10 current + 10 previous month)');
  console.log('  - 2 performance reviews created');
  console.log('  - 3 job postings with 5 applicants each created');
  console.log('\n📱 Demo Login Credentials:');
  console.log('  admin@hireflow.com / demo1234');
  console.log('  manager@hireflow.com / demo1234');
  console.log('  hr@hireflow.com / demo1234');
  console.log('  employee@hireflow.com / demo1234');
  console.log('\n✨ Ready to run! Start the server with: npm run dev\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
