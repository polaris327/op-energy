import config from './config';
import { createPool } from 'mysql2/promise';
import logger from './logger';

export class DB {
  static pool = createPool({
    host: config.DATABASE.HOST,
    port: config.DATABASE.PORT,
    database: config.DATABASE.DATABASE,
    user: config.DATABASE.USERNAME,
    password: config.DATABASE.PASSWORD,
    connectionLimit: 1000,
    supportBigNumbers: true,
    waitForConnections: false,
  });
  static accountPool = createPool({
    host: config.DATABASE.HOST,
    port: config.DATABASE.PORT,
    database: config.DATABASE.ACCOUNT_DATABASE,
    user: config.DATABASE.USERNAME,
    password: config.DATABASE.PASSWORD,
    connectionLimit: 1000,
    supportBigNumbers: true,
    waitForConnections: false,
  });
}

export async function checkDbConnection() {
  try {
    const connection = await DB.pool.getConnection();
    logger.info('Database connection established.');
    connection.release();
  } catch (e) {
    logger.err('Could not connect to database: ' + (e instanceof Error ? e.message : e));
    process.exit(1);
  }
}
