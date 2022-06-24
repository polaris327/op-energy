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
  $addTimeStrikes( blockHeight: number, nlocktime: number): Observable<TimeStrike> {
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let httpParams: HttpParams = new HttpParams();
    httpParams.set('block_height', blockHeight);
    httpParams.set('nlocktime', nlocktime);
    httpParams.set('account_token', accountToken);

    return this.httpClient.post<TimeStrike>(this.apiBaseUrl + this.apiBasePath + '/api/timestrike/mediantime', '', {
      observe: 'body',
      responseType: 'json',
      params : httpParams,
    });
  }
  // returns list of available locked blocks or throws error in case of failure
  $listTimeStrike( ): Observable<TimeStrike[]> {
    var accountToken;
    // get account token from the state service
    let subscription = this.stateService.$accountToken.subscribe( newAccountToken => {
      accountToken = newAccountToken;
    });
    subscription.unsubscribe();

    let httpParams: HttpParams = new HttpParams();
    httpParams.set('account_token', accountToken);

    return this.httpClient.get<TimeStrike[]>(this.apiBaseUrl + this.apiBasePath + '/api/timestrike/mediantime', {
      observe: 'body',
      responseType: 'json',
      params : httpParams,
    });
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

    let httpParams: HttpParams = new HttpParams();
    httpParams.set('account_token', accountToken);
    httpParams.set('block_height', timeStrike.blockHeight);
    httpParams.set('nlocktime', timeStrike.nLockTime);
    httpParams.set('guess', guess);

    return this.httpClient.post<SlowFastGuess>(this.apiBaseUrl + this.apiBasePath + '/api/slowfastguess/mediantime', '', {
      observe: 'body',
      responseType: 'json',
      params : httpParams,
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

    let httpParams: HttpParams = new HttpParams();
    httpParams.set('account_token', accountToken);
    httpParams.set('block_height', timeStrike.blockHeight);
    httpParams.set('nlocktime', timeStrike.nLockTime);

    return this.httpClient.get<SlowFastGuess[]>(this.apiBaseUrl + this.apiBasePath + '/api/slowfastguess/mediantime', {
      observe: 'body',
      responseType: 'json',
      params : httpParams,
    });
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

    let httpParams: HttpParams = new HttpParams();
    httpParams.set('account_token', accountToken);
    httpParams.set('display_name', displayName);

    return this.httpClient.post<string>(this.apiBaseUrl + this.apiBasePath + '/api/user/displayname', '', {
      observe: 'body',
      responseType: 'json',
      params : httpParams,
    });
  }

}
