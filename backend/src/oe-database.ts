import config from './config';
import { createPool, PoolConnection, RowDataPacket, OkPacket, ResultSetHeader, FieldPacket} from 'mysql2/promise';
import logger from './logger';

interface PrivatePoolConnection {
  value: PoolConnection;
};
export class DB {
  static pool = createPool({
    host: config.DATABASE.HOST,
    port: config.DATABASE.PORT,
    database: config.DATABASE.DATABASE,
    user: config.DATABASE.USERNAME,
    password: config.DATABASE.PASSWORD,
    connectionLimit: 10,
    supportBigNumbers: true,
    waitForConnections: false,
  });
  private static async $accountPool_getConnection(UUID: string): Promise<PrivatePoolConnection> {
    logger.info( `${UUID} PROFILE: start: accountPool.getConnection`);
    var connection = await private_DB.accountPool.getConnection();
    logger.info( `${UUID} PROFILE: end: accountPool.getConnection`);
    return ({ value: connection} as PrivatePoolConnection);
  }

  public static async $accountPool_query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>( UUID: string, connection: PrivatePoolConnection, query: string, args: any | any[] | { [param: string]: any }): Promise<[T, FieldPacket[]]> {
    logger.info( `${UUID} PROFILE: start: accountPool.query`);
    var result = await connection.value.query<T>( query, args);
    logger.info( `${UUID} PROFILE: end: accountPool.query`);
    return result;
  }

  private static accountPool_release(UUID: string, connection: PrivatePoolConnection) {
    logger.info( `${UUID} PROFILE: start: accountPool.release`);
    connection.value.release();
    logger.info( `${UUID} PROFILE: end: accountPool.release`);
  }
  public static async $with_accountPool<T>(UUID: string, fn: ((conn: PrivatePoolConnection) => Promise<T>)): Promise<T> {
    const connection = await DB.$accountPool_getConnection( UUID);
    var released = false;
    try {
      const result = await fn( connection);
      DB.accountPool_release( UUID, connection);
      released = true;
      return result;
    } catch(e) {
      if( !released) {
        DB.accountPool_release( UUID, connection);
      }
      throw new Error( `${UUID} ERROR: with_accountPool: ${e instanceof Error? e.message: e}`);
    }
  }
}

class private_DB {
  static accountPool = createPool({
    host: config.DATABASE.HOST,
    port: config.DATABASE.PORT,
    database: config.DATABASE.DATABASE,
    user: config.DATABASE.USERNAME,
    password: config.DATABASE.PASSWORD,
    connectionLimit: 10,
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