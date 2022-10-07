import {DB} from '../database';
import crypto from "crypto-js";
import bitcoinApi from '../../api/bitcoin/bitcoin-api-factory';


import { SlowFastGuessValue, BlockHeight, NLockTime, UserId, TimeStrikeDB, AlphaNumString, TimeStrikeId, AccountToken, TimeStrike, SlowFastGuess, TimeStrikesHistory, SlowFastResult } from './interfaces/op-energy.interface';

export class OpEnergyApiService {
  // those arrays contains callbacks, which will be called when appropriate entity will be created
  private newTimeStrikeCallbacks: ((timeStrike: TimeStrike) => void)[] = [];
  private newTimeSlowFastGuessCallbacks: ((slowFastGues: SlowFastGuess) => void)[] = [];

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
    var rawHash = crypto.SHA256( src + salt);
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
  public async $getUserIdByAccountToken( UUID: string, accountToken: AccountToken): Promise<UserId> {
    const query = "SELECT id,display_name FROM users WHERE secret_hash=?";
    const query1 = 'UPDATE users SET last_log_time=NOW() WHERE id = ?';
    try {
      return await DB.$with_accountPool<UserId>( UUID, async (connection) => {
        const [[raw]] = await DB.$accountPool_query<any>( UUID, connection, query, [ accountToken.accountToken]);
        // update last_log_time field
        const _ = await DB.$accountPool_query<any>( UUID, connection, query1, [ raw.id]);
        return {
          'userId': raw.id,
          'userName': raw.display_name,
        }
      });
    } catch( e) {
      throw new Error( `ERROR: OpEnergyApiService.$getUserIdByAccountToken: ${e instanceof Error? e.message: e}`);
    }
  }
  public async $getUserIdByAccountTokenCreateIfMissing( UUID: string, accountToken: AccountToken): Promise<UserId> {
    try {
      return await this.$getUserIdByAccountToken( UUID, accountToken);
    } catch(e) {
      return this.$createNewUser( UUID, accountToken, this.verifyAlphaNum( 'User'));
    }
  }
  public async $createNewUser( UUID: string, accountToken: AccountToken, displayName: AlphaNumString): Promise<UserId> {
    const query = "INSERT INTO users (secret_hash, display_name, creation_time,last_log_time) VALUES (?,?,NOW(),NOW())";
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [raw] = await DB.$accountPool_query<any>( UUID
                                                      , connection
                                                      , query
                                                      , [ accountToken.accountToken.slice(0,64) // secret_hash
                                                      , displayName.value.slice(0,30)
                                                      ]);
        return {
          'userId': raw.insertId,
          'userName': displayName.value.slice(0,30),
        };
      });
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
  public async $getTimeStrikes( UUID: string, accountToken: AccountToken): Promise<TimeStrikeDB[]> {
    const userId = await this.$getUserIdByAccountTokenCreateIfMissing( UUID, accountToken);
    const query = 'SELECT id,block_height,nlocktime,UNIX_TIMESTAMP(creation_time) as creation_time FROM timestrikes';
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ ]);
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
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getTimeStrikes: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $addTimeStrike( UUID: string, accountToken: AccountToken, blockHeight: BlockHeight, nlocktime: NLockTime): Promise<TimeStrikeDB> {
    const userId = await this.$getUserIdByAccountTokenCreateIfMissing( UUID, accountToken);
    const now = Math.floor( Date.now() / 1000); // unix timestamp in UTC
    const query = 'INSERT INTO timestrikes (user_id,block_height,nlocktime,creation_time) VALUES (?,?,?,FROM_UNIXTIME(?))';
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ userId.userId, blockHeight.value, nlocktime.value, now]);
        const timeStrike = ({
            'blockHeight': blockHeight.value,
            'nLockTime': nlocktime.value,
            'creationTime': now,
        } as TimeStrike);
        if( this.newTimeStrikeCallbacks.length) {
          this.newTimeStrikeCallbacks.forEach((cb) => cb( timeStrike ));
        }
        return ({
          'id': { 'value': result.insertId},
          'value': timeStrike,
        }) as TimeStrikeDB;
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$addTimeStrikes: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $getSlowFastGuesses( UUID: string, accountToken: AccountToken, blockHeight: BlockHeight, nlockTime: NLockTime): Promise<SlowFastGuess[]> {
    const userId = await this.$getUserIdByAccountTokenCreateIfMissing( UUID, accountToken);
    const query = 'SELECT slowfastguesses.id,timestrikes.block_height,timestrikes.nlocktime,guess,slowfastguesses.user_id,users.display_name,UNIX_TIMESTAMP(slowfastguesses.creation_time) as creation_time\
                   FROM slowfastguesses\
                   INNER JOIN timestrikes ON slowfastguesses.timestrike_id = timestrikes.id\
                   INNER JOIN users ON slowfastguesses.user_id = users.id\
                   WHERE timestrikes.block_height = ? AND timestrikes.nlocktime = ?';
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ blockHeight.value, nlockTime.value ]);
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
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getSlowFastGuesses: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
    return [];
  }
  public async $addSlowFastGuess( UUID: string, accountToken: AccountToken, blockHeight: BlockHeight, nLockTime: NLockTime, guess: SlowFastGuessValue) {
    const userId = await this.$getUserIdByAccountTokenCreateIfMissing( UUID, accountToken);
    const timestrike_id = await this.$getTimeStrikeId( UUID, blockHeight, nLockTime);
    const now = Math.floor( Date.now() / 1000); // unix timestamp in UTC
    const query = 'INSERT INTO slowfastguesses (user_id, timestrike_id, guess, creation_time) VALUES(?,?,?,FROM_UNIXTIME(?))';
    try {
      const timeSlowFastGuess = await DB.$with_accountPool( UUID, async (connection) => {
        const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ userId.userId, timestrike_id.value, guess.value, now]);
        return ({
          'guess': guess.value == 0 ? "slow" : "fast",
          'blockHeight': blockHeight.value,
          'nLockTime': nLockTime.value,
          'creationTime': now,
          'userId': userId.userId,
          'userName': userId.userName,
        } as SlowFastGuess);
      });
      if( this.newTimeSlowFastGuessCallbacks.length) {
        this.newTimeSlowFastGuessCallbacks.forEach((cb) => cb( timeSlowFastGuess ));
      }
      return timeSlowFastGuess;
    } catch(e) {
      throw new Error( `$addSlowFastGuess: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $getTimeStrikeId( UUID: string, blockHeight: BlockHeight, nLockTime: NLockTime): Promise<TimeStrikeId> {
    const query = 'SELECT id FROM timestrikes WHERE block_height = ? AND nlocktime = ?';
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [[result]] = await DB.$accountPool_query<any>( UUID, connection, query, [ blockHeight.value, nLockTime.value ]);
        return {
          'value': result.id,
        };
      });
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
  public async $updateUserDisplayName( UUID, accountToken: AccountToken, displayName: AlphaNumString): Promise<string> {
    const userId = await this.$getUserIdByAccountTokenCreateIfMissing( UUID, accountToken);
    const query = 'UPDATE users set display_name=? WHERE users.id = ?';

    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ displayName.value.slice(0,30), userId.userId]);
        return displayName.value;
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$updateUserDisplayName: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }
  public async $getTimeStrikesByBlock( UUID: string, accountToken: AccountToken, blockHeight: BlockHeight): Promise<TimeStrikeDB[]> {
    const userId = await this.$getUserIdByAccountTokenCreateIfMissing( UUID, accountToken);
    const query = 'SELECT id,block_height,nlocktime,UNIX_TIMESTAMP(creation_time) as creation_time FROM timestrikes WHERE block_height=?';

    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
      const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ blockHeight.value ]);
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
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getTimeStrikesByBlock: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
    return [];
  }
  public setNewTimeStrikeCallback( fn: (TimeStrike) => void): void {
    this.newTimeStrikeCallbacks.push(fn);
  }
  public setNewTimeSlowFastGuessCallback( fn: (SlowFastGuess) => void): void {
    this.newTimeSlowFastGuessCallbacks.push(fn);
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

  public async $getTimeStrikesHistory( UUID: string): Promise<TimeStrikesHistory[]> {
    const query = 'SELECT timestrikeshistory.id,user_id,users.display_name,block_height,nlocktime,mediantime,UNIX_TIMESTAMP(timestrikeshistory.creation_time) as creation_time,UNIX_TIMESTAMP(archivetime) as archivetime\
                   FROM timestrikeshistory INNER JOIN users ON timestrikeshistory.user_id = users.id';
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [result] = await DB.$accountPool_query<any>( UUID, connection, query, [ ]);
        return result.map( (record) => {
          return ({
            'owner': record.display_name,
            'blockHeight': record.block_height,
            'nLockTime': record.nlocktime,
            'mediantime': record.mediantime,
            'creationTime': record.creation_time,
            'archiveTime': record.archivetime,
            'wrongResults': record.wrongResults,
            'rightResults': record.rightResults,
          } as TimeStrikesHistory)
        });
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getTimeStrikesHistory: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }

  public async $getSlowFastResult( UUID: string, accountToken: AccountToken, blockHeight: BlockHeight, nlockTime: NLockTime): Promise<SlowFastResult | null> {
    const userId = await this.$getUserIdByAccountToken( UUID, accountToken);
    const query = 'SELECT slowfastresults.id,timestrikeshistory.block_height,timestrikeshistory.nlocktime,guess,result,slowfastresults.user_id,users.display_name,UNIX_TIMESTAMP(slowfastresults.creation_time) as creation_time\
                   FROM slowfastresults\
                   INNER JOIN timestrikeshistory ON slowfastresults.timestrikehistory_id = timestrikeshistory.id\
                   INNER JOIN users ON slowfastresults.user_id = users.id\
                   WHERE slowfastresults.user_id = ? AND timestrikeshistory.block_height = ? AND timestrikeshistory.nlocktime = ?';
    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [results] = await DB.$accountPool_query<any>( UUID, connection, query, [ userId.userId, blockHeight.value, nlockTime.value ]);
        if (results.length < 1) {
          return null;
        } else {
          let [record] = results;
          return ({
            'guess': record.guess == 0? "slow" : "fast",
            'result': record.result == 0? "wrong" : "right",
            'blockHeight': record.block_height,
            'nLockTime': record.nlocktime,
            'creationTime': record.creation_time,
          } as SlowFastResult);
        }
      });
    } catch(e) {
      throw new Error(`OpEnergyApiService.$getSlowFastResult: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }

  // searchs strikes and slow/fast guesses under blockHeightTip - 6
  async $slowFastGamePersistOutcome( UUID: string) {
    const blockHeightTip = await bitcoinApi.$getBlockHeightTip();
    const confirmedHeight = Math.max( blockHeightTip - 6, 0);

    try {
      return await DB.$with_accountPool( UUID, async (connection) => {
        const [timestrikesguesses] = await DB.$accountPool_query<any>( UUID, connection, 'SELECT id,user_id,block_height,nlocktime,UNIX_TIMESTAMP(creation_time) as creation_time FROM timestrikes WHERE block_height <= ?', [ confirmedHeight ]);
        for( var i = 0; i < timestrikesguesses.length; i++) {
          const blockHash = await bitcoinApi.$getBlockHash(timestrikesguesses[i].block_height);
          const block = await bitcoinApi.$getBlock(blockHash);
          const [[timestrikehistory_id]] = await DB.$accountPool_query<any>( UUID, connection
            , 'INSERT INTO timestrikeshistory (user_id, block_height, nlocktime, mediantime, creation_time, archivetime, wrong_results, right_results) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?), NOW(),0,0) returning id'
            , [ timestrikesguesses[i].user_id, timestrikesguesses[i].block_height, timestrikesguesses[i].nlocktime, block.mediantime, timestrikesguesses[i].creation_time ]
          ); // store result into separate table
          let wrong_results = 0;
          let right_results = 0;
          const [guesses] = await DB.$accountPool_query<any>( UUID, connection
            , 'SELECT id,user_id,timestrike_id,guess,UNIX_TIMESTAMP(creation_time) as creation_time FROM slowfastguesses WHERE timestrike_id = ?'
            , [ timestrikesguesses[i].id ]
          );
          for( var j = 0; j < guesses.length; j++) {
            var result = 0; // wrong
            if( block.mediantime <= guesses[j].nlocktime && guesses[j].guess == 1) { // guessed fast and it was actually faster
              result = 1; // right
              right_results++;
            } else
            if( block.mediantime > timestrikesguesses[i].nlocktime && guesses[j].guess == 0) { // guess slow and it was actually slower
              result = 1; // right
              right_results++;
            } else {
              wrong_results ++;
            }
            await DB.$accountPool_query<any>( UUID, connection
              , 'INSERT INTO slowfastresults (user_id,timestrikehistory_id,guess,result,creation_time) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))'
              , [ guesses[j].user_id
                , timestrikehistory_id.id
                , guesses[j].guess
                , result // result is being stored here
                , guesses[j].creation_time
                ]
            );
            await DB.$accountPool_query<any>( UUID, connection
              , 'DELETE FROM slowfastguesses WHERE id=?'
              , [ guesses[j].id
                ]
            );
          }
          await DB.$accountPool_query<any>( UUID, connection
            , 'UPDATE timestrikeshistory SET wrong_results = ?, right_results = ? WHERE id = ?'
            , [ wrong_results, right_results, timestrikehistory_id.id ]
          ); // persist some statistics
          await DB.$accountPool_query<any>( UUID, connection, 'DELETE FROM timestrikes WHERE id = ?;' , [ timestrikesguesses[i].id ]); // remove time strike guess as it now in the timestrikehistory table
        }
      });
    } catch(e) {
      throw new Error(`${UUID} OpEnergyApiService.$singlePlayerPersistOutcome: failed to query DB: ${e instanceof Error? e.message : e}`);
    }
  }

  async $persistOutcome( UUID: string) {
    // currently, it is assumed, that timestrikes and timestrikeshistory tables are only being used by slow/fast game.
    // NOTE: in the future, it maybe that other games will be using those tables. In this case, we will need to move cleanup of the timestrike table here instead of doing it in the $slowFastGamePersistOutcome
    await this.$slowFastGamePersistOutcome( UUID); // persist outcome for slow fast game
  }

}

export default new OpEnergyApiService();
