import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeStrike, SlowFastGuess } from '../interfaces/op-energy.interface';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class OpEnergyApiService {
  private apiBaseUrl: string; // base URL is protocol, hostname, and port
  private apiBasePath: string; // network path is /testnet, etc. or '' for mainnet
  constructor(
    private httpClient: HttpClient,
    private stateService: StateService,
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
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
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
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let params = {
      account_token: accountToken,
    };

    return this.httpClient.get<TimeStrike[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strike/mediantime', {params});
  }
  // returns list of available locked blocks for a given block height or throws error in case of failure
  $listTimeStrikesByBlockHeight( blockHeight: number): Observable<TimeStrike[]> {
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let params = {
      account_token: accountToken,
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
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let params = {
      account_token: accountToken,
      block_height: timeStrike.blockHeight,
      nlocktime: timeStrike.nLockTime,
      guess: guess,
    };

    return this.httpClient.post<SlowFastGuess>(this.apiBaseUrl + this.apiBasePath + '/api/v1/slowfastguess/mediantime', params, {
      observe: 'body',
      responseType: 'json',
    });
  }
  // returns list of the guesses for a given timelocked block
  $listSlowFastGuesses( timeStrike: TimeStrike): Observable<SlowFastGuess[]> {
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let params = {
      account_token: accountToken,
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
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let params = {
      account_token: accountToken,
      display_name: displayName,
    };

    return this.httpClient.post<string>(this.apiBaseUrl + this.apiBasePath + '/api/v1/user/displayname', params, {
      observe: 'body',
      responseType: 'json',
    });
  }

}
