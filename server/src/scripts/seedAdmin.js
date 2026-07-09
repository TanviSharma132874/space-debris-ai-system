const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDatabase = require('../config/database');
const User = require('../models/User');

const DEVELOPMENT_DEFAULTS = {
  name: 'Mission Administrator',
  email: 'admin@space-debris.local',
  password: 'Admin@12345',
};

const getAdminCredentials = () => {
  const missingVariables = [];

  const name = process.env.ADMIN_NAME || DEVELOPMENT_DEFAULTS.name;
  const email = process.env.ADMIN_EMAIL || DEVELOPMENT_DEFAULTS.email;
  const password = process.env.ADMIN_PASSWORD || DEVELOPMENT_DEFAULTS.password;

  if (!process.env.ADMIN_NAME) missingVariables.push('ADMIN_NAME');
  if (!process.env.ADMIN_EMAIL) missingVariables.push('ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD) missingVariables.push('ADMIN_PASSWORD');

  return {
    credentials: { name, email, password },
    missingVariables,
  };
};

const printDevelopmentDefaults = (missingVariables) => {
  if (missingVariables.length === 0) {
    return;
  }

  console.warn('[seed:admin] Missing environment variables:', missingVariables.join(', '));
  console.warn('[seed:admin] Development defaults are being used for missing values.');

  if (missingVariables.includes('ADMIN_NAME')) {
    console.warn(`[seed:admin] Default ADMIN_NAME: ${DEVELOPMENT_DEFAULTS.name}`);
  }

  if (missingVariables.includes('ADMIN_EMAIL')) {
    console.warn(`[seed:admin] Default ADMIN_EMAIL: ${DEVELOPMENT_DEFAULTS.email}`);
  }

  if (missingVariables.includes('ADMIN_PASSWORD')) {
    console.warn(`[seed:admin] Default ADMIN_PASSWORD: ${DEVELOPMENT_DEFAULTS.password}`);
  }
};

const seedInitialAdministrator = async () => {
  const { credentials, missingVariables } = getAdminCredentials();

  printDevelopmentDefaults(missingVariables);

  await connectDatabase();

  const existingAdmin = await User.findOne({ role: 'Admin' }).select('_id email');

  if (existingAdmin) {
    console.log(`[seed:admin] Administrator already exists (${existingAdmin.email}). No user created.`);
    return;
  }

  const userCount = await User.countDocuments();

  if (userCount > 0) {
    console.log(
      `[seed:admin] Users collection is not empty (${userCount} user(s)). Initial Administrator was not created.`,
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(credentials.password, 10);

  const admin = await User.create({
    name: credentials.name,
    email: credentials.email,
    password: hashedPassword,
    role: 'Admin',
  });

  console.log('[seed:admin] Initial Administrator created successfully.');
  console.log(`[seed:admin] Name: ${admin.name}`);
  console.log(`[seed:admin] Email: ${admin.email}`);

  if (missingVariables.includes('ADMIN_PASSWORD')) {
    console.log(`[seed:admin] Development Password: ${DEVELOPMENT_DEFAULTS.password}`);
    console.log('[seed:admin] Change this password before production use.');
  }
};

seedInitialAdministrator()
  .catch((error) => {
    console.error(`[seed:admin] Failed to seed Administrator: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
