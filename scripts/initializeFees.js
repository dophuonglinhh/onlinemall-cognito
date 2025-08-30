const mongoose = require('mongoose');
const Fee = require('../models/fees');
require('dotenv').config();

// MongoDB connection configuration
const mongoDB = process.env.MONGODB_URL;
if (!mongoDB) {
  console.error(
    "Missing MONGODB_URI in environment. Please set it in your .env file."
  );
  process.exit(1);
}

const connectionOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  retryWrites: true,
  writeConcern: {
    w: 'majority'
  }
};

async function initializeFees() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoDB, connectionOptions);
    console.log('Connected to MongoDB successfully');

    // Check if fees already exist
    const existingFees = await Fee.find({});
    if (existingFees.length > 0) {
      console.log('Fees already exist in database. Current fees:');
      existingFees.forEach(fee => {
        console.log(`- ${fee.name}: ${fee.description} - ${fee.amount}`);
      });
      return;
    }

    // Create initial fee data
    const initialFees = [
      {
        name: 'Premium Membership',
        type: 'shopper',
        description: 'Annual fee for accessing exclusive discounts and promotions.',
        amount: '$20/year'
      },
      {
        name: 'Transaction Fee',
        type: 'shopper',
        description: 'Fixed fee for each purchase made through the mall\'s payment system.',
        amount: '$2 per Transaction'
      },
      {
        name: 'Monthly Renting Fee',
        type: 'storeOwner',
        description: 'Monthly rent for using a store space in the mall.',
        amount: '$50/month'
      },
      {
        name: 'Commission Fee',
        type: 'storeOwner',
        description: 'Percentage charged on each product sale made in the mall.',
        amount: '5% of Sales'
      }
    ];

    console.log('Creating initial fees...');
    for (const feeData of initialFees) {
      const fee = new Fee(feeData);
      await fee.save();
      console.log(`Created fee: ${fee.name}`);
    }

    console.log('All initial fees created successfully!');

  } catch (error) {
    console.error('Error initializing fees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initializeFees();