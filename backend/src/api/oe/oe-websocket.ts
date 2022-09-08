import config from '../../config';
import * as WebSocket from 'ws';
import logger from '../../logger';
import {
  BlockExtended, TransactionExtended, WebsocketResponse, MempoolBlock,
  OptimizedStatistic, ILoadingIndicators, IConversionRates
} from '../../mempool.interfaces';
import { exec } from 'child_process';
import crypto from "crypto-js";

import { TimeStrike, SlowFastGuess } from '../interfaces/op-energy.interface';

import opEnergyApiService from '../op-energy.service';

class OpEnergyWebsocket {

  private wss: WebSocket.Server | undefined;

  public setUpWebsocketHandling(wss: WebSocket.Server) {
    this.wss = wss;
  }

  public websocketHandler(client: any, parsedMessage: WebsocketResponse) {
    if (parsedMessage && parsedMessage['track-time-strikes'] === 'start') {
      client['want-time-strikes'] = true; // want notifications about ALL time strikes
    }
    if (parsedMessage && parsedMessage['track-time-strikes'] === 'stop') {
      client['want-time-strikes'] = null;
    }
    if (parsedMessage && parsedMessage['track-time-strike-start'] !== undefined) {
      const ts = parsedMessage['track-time-strike-start'];
      const blockHeight = opEnergyApiService.verifyBlockHeight(ts.blockHeight);
      const nLockTime = opEnergyApiService.verifyNLockTime(ts.nLockTime);
      const value = {
        'blockHeight': blockHeight.value,
        'nLockTime': nLockTime.value,
      };
      if (client['track-time-strikes'] !== undefined) { // already an array
        if (client['track-time-strikes'].indexOf(value) < 0) { // add only if it is not already exists
          client['track-time-strikes'].push(value);
        }
      } else { // create initial array
        client['track-time-strikes'] = [value];
      }
    }
    if (parsedMessage && parsedMessage['track-time-strike-stop'] !== undefined) {
      const ts = parsedMessage['track-time-strike-stop'];
      const blockHeight = opEnergyApiService.verifyBlockHeight(ts.blockHeight);
      const nLockTime = opEnergyApiService.verifyNLockTime(ts.nLockTime);
      const value = {
        'blockHeight': blockHeight.value,
        'nLockTime': nLockTime.value,
      };

      if (client['track-time-strikes']) {
        client['track-time-strikes'] = client['track-time-strikes'].filter((element, index, array) => element.blockHeight !== value.blockHeight && element.nLockTime !== value.nLockTime);
      }
    }
    if (parsedMessage.action === 'checkAccountSecret' && parsedMessage.data.length > 0) {
      client.send(JSON.stringify(this.checkAccountSecret(parsedMessage.data[0])));
    }

    if (parsedMessage.action === 'want' && parsedMessage.data.indexOf('generatedaccounttoken') > -1) {
      this.handleGeneratedAccountToken(client);
    }

  }
  // this procedure generates:
  // - a random secret, which is a sha256 hash
  // - an appropriate API token for generated random secret
  handleGeneratedAccountToken(client) {
    exec('dd if=/dev/urandom bs=10 count=1 | sha256sum'
      , (error, stdout, stderr) => {
        if (error) {
          logger.info('handleGeneratedAccountToken: exec error: ' + error);
        } else {
          var newHashArr = [...stdout.slice(0, 64)];
          // set signature bytes in order to be able to perform a simple check of the user's input
          newHashArr[10] = '0';
          newHashArr[30] = 'e';
          newHashArr[60] = 'e';
          const newHash = newHashArr.join('');
          const newAccountToken = this.getHashSalt(newHash, config.DATABASE.SECRET_SALT);
          if (this.isAlphaNum(newHash)) {
            client.send(JSON.stringify({
              'generatedAccountSecret': newHash, // this value is being used to access account
              'generatedAccountToken': newAccountToken, // this value will be used as API token
            }));
          }
        }
      }
    );
  }
  // returns a set with the only key:
  // - 'declinedAccountSecret' in case if accountSecret haven't passed any check. The value is a short description of error
  // - 'checkedAccountToken' in case if accountSecret had passed the checks. The value is an API token which can be used for appropriate API calls
  checkAccountSecret(accountSecret: string) {
    if (accountSecret.length !== 64) {
      return {
        declinedAccountSecret: 'length',
      };
    }
    if (accountSecret[10] !== '0'
      || accountSecret[30] !== 'e' // secret has e at this position
      || accountSecret[60] !== 'e'
    ) {
      return {
        declinedAccountSecret: 'header',
      };
    }
    if (!this.isAlphaNum(accountSecret)) {
      return {
        declinedAccountSecret: 'alphanum',
      };
    }
    let accountToken = this.getHashSalt(accountSecret, config.DATABASE.SECRET_SALT);
    return {
      checkedAccountToken: accountToken,
    };
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
  getHashSalt(src: string, salt: string): string {
    if (src.length < 64) {
      throw new Error("getHashSalt: src.length < 64");
    }
    if (salt.length < 64) {
      throw new Error("getHashSalt: salt.length < 64");
    }
    var rawHash = [...crypto.SHA256(src + salt).toString().slice(0, 64)];
    // set significant bytes to be able to make a dumb check later
    rawHash[10] = '0';
    rawHash[30] = '0'; // token has 0 at this position
    rawHash[60] = 'e';
    return rawHash.join('').slice(0, 64);
  }
  isAlphaNum(str: string) {
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


}

export default new OpEnergyWebsocket();