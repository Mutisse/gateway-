import mongoose from 'mongoose';
import chalk from 'chalk';

const getTimestamp = () => chalk.gray(`[${new Date().toISOString()}]`);

export const connectDatabase = async (): Promise<void> => {
  try {
    // Use a URI do seu .env
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gateway-logs';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`${getTimestamp()} ${chalk.green('✅')} MongoDB connected successfully`);
  } catch (error) {
    console.error(`${getTimestamp()} ${chalk.red('❌')} MongoDB connection error:`, error);
    process.exit(1);
  }
};

// Event handlers para a conexão
mongoose.connection.on('error', (err) => {
  console.error(`${getTimestamp()} ${chalk.red('❌')} MongoDB connection error:`, err);
});

mongoose.connection.on('disconnected', () => {
  console.log(`${getTimestamp()} ${chalk.yellow('⚠️')} MongoDB disconnected`);
});

mongoose.connection.on('reconnected', () => {
  console.log(`${getTimestamp()} ${chalk.green('✅')} MongoDB reconnected`);
});