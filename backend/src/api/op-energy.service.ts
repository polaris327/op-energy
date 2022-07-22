import logger from '../logger';
import { DB } from '../database';
import {exec} from 'child_process';
import * as sha256 from 'crypto-js/sha256';

import { SlowFastGuessValue, BlockHeight, NLockTime, UserId, TimeStrikeDB, AlphaNumString, TimeStrikeId, AccountToken, TimeStrike, SlowFastGuess } from './interfaces/op-energy.interface';

export class OpEnergyApiService {
  constructor(
  ) {
  }
  // returns a string(64) which is a sha256 hash of the src + salt string
  // result contains at indexes:
  // - 10: '0'
  // - 30: '0'
  // - 60: 'e'
  // which is done just to be able to perform a quick check of the user's input
  // Params:
  // - src - string(64)
  // - salt - string(64)
  getHashSalt( src: string, salt: string):string {
    if( src.length < 64) {
      throw new Error("getHashSalt: src.length < 64");
    }
    if( salt.length < 64) {
      throw new Error("getHashSalt: salt.length < 64");
    }
    var rawHash = sha256( src + salt);
    // set significant bytes to be able to make a dumb check later
    rawHash[10] = '0';
    rawHash[30] = '0'; // token has 0 at this position
    rawHash[60] = 'e';
    return rawHash.toString().slice(0,64);
  }
  isAlphaNum(str: string){
    var code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
      code = str.charAt(i);
      if (!((code >= '0' && code <= '9') || // numeric (0-9)
            (code >= 'A' && code <= 'Z') || // upper alpha (A-Z)
            (code >= 'a' && code <= 'z')    // lower alpha (a-z)
            )
          ) {
        return false;
      }
    }
    return true;
  }
  public verifyNLockTime( num: number): NLockTime {
    if( num < 0) {
      throw new Error('verifyNLockTime: negative');
    }
    return {
      'value': num,
    };
  }
  public verifyBlockHeight( num: number): BlockHeight {
    if( num < 0) {
      throw new Error('verifyBlockHeight: negative');
    }
    if( num > 500000) {
      throw new Error( 'verifyBlockHeight: accordingly to nlocktime docs, block height should not exceed 500000');
    }
    return {
      'value': num,
    };
  }
  public verifyAccountToken( rawString: string): AccountToken {
    if( rawString.length !== 64) {
      throw new Error('verifyAccountToken: length');
    }
    if( rawString[10] !== '0'
      ||rawString[30] !== '0' // token has 0 at this position
      ||rawString[60] !== 'e'
      ) {
      throw new Error('verifyAccountToken: header');
    }
    if( !this.isAlphaNum(rawString)) {
      throw new Error('verifyAccountToken: alphanum');
    }
    return {
      'accountToken': rawString,
    };
  }
  public async $getUserIdByAccountToken( accountToken: AccountToken): Promise<UserId> {
    try {
      var connection = await DB.accountPool.getConnection();
      const query = "SELECT id,display_name FROM users WHERE secret_hash=?";
      const [[raw]] = await connection.query<any>( query, [ accountToken.accountToken]);
      // update last_log_time field
      const query1 = 'UPDATE users SET last_log_time=NOW() WHERE id = ?';
      const _ = await connection.query<any>( query1, [ raw.id]);
      connection.release();
      return {
        'userId': raw.id,
        'userName': raw.display_name,
      };
    } catch( e) {
      throw new Error( `ERROR: OpEnergyApiService.$getUserIdByAccountToken: ${e instanceof Error? e.message: e}`);
    }
  }
  public async $getUserIdByAccountTokenCreateIfMissing( accountToken: AccountToken): Promise<UserId> {
    try {
      return await this.$getUserIdByAccountToken( accountToken);
    } catch(e) {
      return this.$createNewUser( accountToken, this.verifyAlphaNum( 'User'));
    }
  }
  public async $createNewUser( accountToken: AccountToken, displayName: AlphaNumString): Promise<UserId> {
    try {
      const connection = await DB.accountPool.getConnection();
      const query = "INSERT INTO users (secret_hash, display_name, creation_time,last_log_time) VALUES (?,?,NOW(),NOW())";
      const [raw] = await connection.query<any>( query, [ accountToken.accountToken.slice(0,64) // secret_hash
                                                          , displayName.value.slice(0,30)
                                                          ]);
      connection.release();
      return {
        'userId': raw.insertId,
        'userName': displayName.value.slice(0,30),
      };
    } catch (e) {
      throw new Error( `ERROR: OpEnergyApiService.$createNewUser: ${ e instanceof Error? e.message: e}`);
    }
  }
  public verifyAlphaNum( rawString: string): AlphaNumString {
    if( this.isAlphaNum( rawString)) {
      return {
        'value': rawString,
      };
    } else {
      throw new Error( 'ERROR: OpEnergyApiService.verifyAlphaNum: not alpha num');
    }
  }
  public async $getTimeStrikes( accountToken: AccountToken): Promise<TimeStrikeDB[]> {
    try {
      const userId = await this.$getUserIdByAccountTokenCreateIfMissing( accountToken);
      const connection = await DB.accountPool.getConnection();
      const query = 'SELECT id,block_height,nlocktime,UNIX_TIMESTAMP(creation_time) as creation_time FROM timestrikes';

      const [result] = await connection.query<any>( query, [ ]);
      connection.release();
      return result.map( (record) => {
        return ({
          'id': { 'value': record.id},
          'value': {
            'blockHeight': record.block_height,
            'nLockTime': record.nlocktime,
            'creationTime': record.creation_time,
          },
        } as TimeStrikeDB)
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getTimeStrikes: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
    return [];
  }
  public async $addTimeStrike( accountToken: AccountToken, blockHeight: BlockHeight, nlocktime: NLockTime): Promise<TimeStrikeDB> {
    try {
      const userId = await this.$getUserIdByAccountTokenCreateIfMissing( accountToken);
      const connection = await DB.accountPool.getConnection();
      const now = Math.floor( Date.now() / 1000); // unix timestamp in UTC
      const query = 'INSERT INTO timestrikes (user_id,block_height,nlocktime,creation_time) VALUES (?,?,?,FROM_UNIXTIME(?))';

      const [result] = await connection.query<any>( query, [ userId.userId, blockHeight.value, nlocktime.value, now]);
      connection.release();
      return ({
        'id': { 'value': result.insertId},
        'value': {
          'blockHeight': blockHeight.value,
          'nLockTime': nlocktime.value,
          'creationTime': now,
        },
      }) as TimeStrikeDB;
    } catch(e) {
      throw new Error(`OpEnergyApiService.$addTimeStrikes: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $getSlowFastGuesses( accountToken: AccountToken, blockHeight: BlockHeight, nlockTime: NLockTime): Promise<SlowFastGuess[]> {
    try {
      const userId = await this.$getUserIdByAccountTokenCreateIfMissing( accountToken);
      const connection = await DB.accountPool.getConnection();
      const query = 'SELECT slowfastguesses.id,timestrikes.block_height,timestrikes.nlocktime,guess,slowfastguesses.user_id,users.display_name,UNIX_TIMESTAMP(slowfastguesses.creation_time) as creation_time\
                     FROM slowfastguesses\
                     INNER JOIN timestrikes ON slowfastguesses.timestrike_id = timestrikes.id\
                     INNER JOIN users ON slowfastguesses.user_id = users.id\
                     WHERE timestrikes.block_height = ? AND timestrikes.nlocktime = ?';
      const [result] = await connection.query<any>( query, [ blockHeight.value, nlockTime.value ]);
      connection.release();
      return result.map( (record) => {
        return ({
          'guess': record.guess == 0? "slow" : "fast",
          'blockHeight': record.block_height,
          'nLockTime': record.nlocktime,
          'creationTime': record.creation_time,
          'userId': record.user_id,
          'userName': record.display_name,
        } as SlowFastGuess)
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getSlowFastGuesses: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
    return [];
  }
  public async $addSlowFastGuess( accountToken: AccountToken, blockHeight: BlockHeight, nLockTime: NLockTime, guess: SlowFastGuessValue) {
    try {
      const userId = await this.$getUserIdByAccountTokenCreateIfMissing( accountToken);
      const timestrike_id = await this.$getTimeStrikeId( blockHeight, nLockTime);
      const now = Math.floor( Date.now() / 1000); // unix timestamp in UTC
      const connection = await DB.accountPool.getConnection();
      const query = 'INSERT INTO slowfastguesses (user_id, timestrike_id, guess, creation_time) VALUES(?,?,?,FROM_UNIXTIME(?))';
      const [result] = await connection.query<any>( query, [ userId.userId, timestrike_id.value, guess.value, now]);
      connection.release();
      return ({
        'guess': guess.value == 0 ? "slow" : "fast",
        'blockHeight': blockHeight.value,
        'nLockTime': nLockTime.value,
        'creationTime': now,
        'userId': userId.userId,
        'userName': userId.userName,
      } as SlowFastGuess);
    } catch(e) {
      throw new Error( `$addSlowFastGuess: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $getTimeStrikeId( blockHeight: BlockHeight, nLockTime: NLockTime): Promise<TimeStrikeId> {
    try {
      const connection = await DB.accountPool.getConnection();
      const query = 'SELECT id FROM timestrikes WHERE block_height = ? AND nlocktime = ?';
      const [[result]] = await connection.query<any>( query, [ blockHeight.value, nLockTime.value ]);
      connection.release();
      return {
        'value': result.id,
      };
    } catch(e) {
      throw new Error( `$getTimeStrikeId: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public verifySlowFastGuessValue( raw: string): SlowFastGuessValue {
    if( raw !== "slow" && raw !== "fast") {
      throw new Error( 'ERROR: verifySlowFastGuessValue: wrong value');
    }
    return {
      'value': raw == "slow" ? 0 : 1,
    };
  }
  public async $updateUserDisplayName( accountToken: AccountToken, displayName: AlphaNumString): Promise<string> {
    try {
      const userId = await this.$getUserIdByAccountTokenCreateIfMissing( accountToken);
      const connection = await DB.accountPool.getConnection();
      const query = 'UPDATE users set display_name=? WHERE users.id = ?';

      const [result] = await connection.query<any>( query, [ displayName.value.slice(0,30), userId.userId]);
      connection.release();
      return displayName.value;
    } catch(e) {
      throw new Error(`OpEnergyApiService.$updateUserDisplayName: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $getTimeStrikesByBlock( accountToken: AccountToken, blockHeight: BlockHeight): Promise<TimeStrikeDB[]> {
    try {
      const userId = await this.$getUserIdByAccountTokenCreateIfMissing( accountToken);
      const connection = await DB.accountPool.getConnection();
      const query = 'SELECT id,block_height,nlocktime,UNIX_TIMESTAMP(creation_time) as creation_time FROM timestrikes WHERE block_height=?';

      const [result] = await connection.query<any>( query, [ blockHeight.value ]);
      connection.release();
      return result.map( (record) => {
        return ({
          'id': { 'value': record.id},
          'value': {
            'blockHeight': record.block_height,
            'nLockTime': record.nlocktime,
            'creationTime': record.creation_time,
          },
        } as TimeStrikeDB)
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getTimeStrikesByBlock: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
    return [];
  }
  // this procedure returns a random hash, which is a sha256 hash
  async $generateRandomHash(): Promise<string> {
    const util = require('node:util');
    const exec = util.promisify(require('node:child_process').exec);
    const { stdout, stderr } = await exec( 'dd if=/dev/urandom bs=10 count=1 | sha256sum');
    var newHashArr = [...stdout.slice(0, 64)];
    // set signature bytes in order to be able to perform a simple check of the user's input
    const newHash = newHashArr.join('');
    if( newHash.length < 64) {
      throw new Error( 'generateRandomHash: exec error: length( stdout) < 64: ' + stderr);
    }
    if( !this.isAlphaNum( newHash)) {
      throw new Error( 'generateRandomHash: generated hash is not alpha-number');
    }
    return newHash;
  }

}

export default new OpEnergyApiService();