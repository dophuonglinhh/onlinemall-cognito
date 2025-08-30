const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection configuration
const mongoDB = process.env.MONGODB_URI;
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

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoDB, connectionOptions);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;

    // Create indexes for Products collection
    console.log('Creating indexes for Products collection...');
    await db.collection('products').createIndex({ index_featured: 1 });
    await db.collection('products').createIndex({ store_featured: 1 });
    await db.collection('products').createIndex({ store: 1 });
    await db.collection('products').createIndex({ date_added: -1 });
    await db.collection('products').createIndex({ name: 'text' }); // Text search index
    await db.collection('products').createIndex({ store: 1, date_added: -1 }); // Compound index

    // Create indexes for Stores collection
    console.log('Creating indexes for Stores collection...');
    await db.collection('stores').createIndex({ featured: 1 });
    await db.collection('stores').createIndex({ store_category: 1 });
    await db.collection('stores').createIndex({ store_name: 1 });
    await db.collection('stores').createIndex({ store_name: 'text' }); // Text search index
    await db.collection('stores').createIndex({ date_added: -1 });
    await db.collection('stores').createIndex({ owner: 1 });

    // Create indexes for Users collection
    console.log('Creating indexes for Users collection...');
    // Create sparse unique indexes to handle null values
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });

    console.log('All indexes created successfully!');
    
    // List all indexes
    console.log('\nListing all indexes:');
    const productIndexes = await db.collection('products').indexes();
    console.log('Product indexes:', productIndexes.map(idx => idx.name));
    
    const storeIndexes = await db.collection('stores').indexes();
    console.log('Store indexes:', storeIndexes.map(idx => idx.name));
    
    const userIndexes = await db.collection('users').indexes();
    console.log('User indexes:', userIndexes.map(idx => idx.name));

  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createIndexes();