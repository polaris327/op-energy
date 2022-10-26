import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Subject, fromEvent, Observable } from 'rxjs';
import { HttpParams, HttpClient } from '@angular/common/http';
import { TimeStrike, SlowFastGuess, SlowFastGuessOutcome, TimeStrikesHistory, SlowFastResult } from '../interfaces/op-energy.interface';
import { StateService } from '../../services/state.service';
import { WebsocketService } from 'src/app/services/websocket.service';

import { WebsocketResponse, IBackendInfo } from '../../interfaces/websocket.interface';
import { OpEnergyWebsocketResponse } from '../interfaces/websocket.interface';
import { take, switchMap} from 'rxjs/operators';
import { OeStateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class OpEnergyApiService {

  private apiBaseUrl: string; // base URL is protocol, hostname, and port
  private apiBasePath: string; // network path is /testnet, etc. or '' for mainnet
  constructor(
    private httpClient: HttpClient,
    private stateService: StateService,
    private opEnergyStateService: OeStateService,
    private websocketService: WebsocketService,
  ) {
    this.apiBaseUrl = ''; // use relative URL by default
    if (!stateService.isBrowser) { // except when inside AU SSR process
      this.apiBaseUrl = this.stateService.env.NGINX_PROTOCOL + '://' + this.stateService.env.NGINX_HOSTNAME + ':' + this.stateService.env.NGINX_PORT;
    }
    this.apiBasePath = ''; // assume mainnet by default
    this.stateService.networkChanged$.subscribe((network) => {
      if (network === 'bisq') {
        network = '';
      }
      this.apiBasePath = network ? '/' + network : '';
    });
  }

  // adds blocked, locked by time by current user
  // params:
  // - blockHeight - height of the block
  // - nlocktime - time, by which lock is being blocked
  // returns TimeStrike value in case of success or throws error otherwise
  $addTimeStrike( blockHeight: number, nlocktime: number): Observable<TimeStrike> {
    var accountToken;
    // get account token from the state service
    let subscription = this.opEnergyStateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let params = {
      block_height: blockHeight,
      nlocktime: nlocktime,
      account_token: accountToken,
    };

    return this.httpClient.post<TimeStrike>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strike/mediantime', params, {
      observe: 'body',
      responseType: 'json',
    });
  }
  // returns list of available locked blocks or throws error in case of failure
  $listTimeStrikes( ): Observable<TimeStrike[]> {
    let params = {
    };

    return this.httpClient.get<TimeStrike[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strike/mediantime', {params});
  }
  // returns list of available locked blocks for a given block height or throws error in case of failure
  $listTimeStrikesByBlockHeight( blockHeight: number): Observable<TimeStrike[]> {
    let params = {
      block_height: blockHeight,
    };

    return this.httpClient.get<TimeStrike[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strike/block/mediantime', {params});
  }
  // this function returns an observable with value of type SlowFastGuess, meaning, that the guess had been persisted in the DB
  // params:
  // - guess: "slow" or "fast"
  // - lockedBlockHeight: height of the locked block number
  // - medianSeconds: value of locked block's median time to guess
  $slowFastGuess( guess: "slow" | "fast", timeStrike: TimeStrike): Observable<SlowFastGuess> {
    return this.opEnergyStateService.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
      let params = {
        account_token: newAccountToken,
        block_height: timeStrike.blockHeight,
        nlocktime: timeStrike.nLockTime,
        guess: guess,
      };

      return this.httpClient.post<SlowFastGuess>(this.apiBaseUrl + this.apiBasePath + '/api/v1/slowfastguess/mediantime', params, {
        observe: 'body',
        responseType: 'json',
      });
    }));
  }
  // returns list of the guesses for a given timelocked block
  $listSlowFastGuesses( timeStrike: TimeStrike): Observable<SlowFastGuess[]> {
    let params = {
      block_height: timeStrike.blockHeight,
      nlocktime: timeStrike.nLockTime,
    };

    return this.httpClient.get<SlowFastGuess[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/slowfastguess/mediantime', {params});
  }

  // updates displayable user name for a current user
  // params:
  // - guess: "slow" or "fast"
  // - lockedBlockHeight: height of the locked block number
  // - medianSeconds: value of locked block's median time to guess
  $updateUserDisplayName( displayName: string): Observable<string> {
    return this.opEnergyStateService.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
      let params = {
        account_token: newAccountToken,
        display_name: displayName,
      };

      return this.httpClient.post<string>(this.apiBaseUrl + this.apiBasePath + '/api/v1/user/displayname', params, {
        observe: 'body',
        responseType: 'json',
      });
    }));
  }

  // returns list of strikes results or throws error in case of failure
  $listTimeStrikesHistory( ): Observable<TimeStrikesHistory[]> {
    return this.httpClient.get<TimeStrikesHistory[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strikeshistory/mediantime', {});
  }

  // returns list of the slow/fast guess results for a given timelocked block
  $listSlowFastResults( timeStrikesHistory: TimeStrikesHistory): Observable<SlowFastResult | null> {
    return this.opEnergyStateService.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
      let params = {
        account_token: newAccountToken,
        block_height: timeStrikesHistory.blockHeight,
        nlocktime: timeStrikesHistory.nLockTime,
      };

      return this.httpClient.get<SlowFastResult | null>(this.apiBaseUrl + this.apiBasePath + '/api/v1/slowfastresults/mediantime', {params});
    }));
  }
  checkAccountSecret( accountSecret: string) {
    if (!this.stateService.isBrowser) {
      return;
    }
    this.websocketService.customMessage( {action: 'checkAccountSecret', data: [ accountSecret] });
  }

}
