import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Subject, fromEvent, Observable } from 'rxjs';
import { HttpParams, HttpClient } from '@angular/common/http';
import { TimeStrike, SlowFastGuess, SlowFastGuessOutcome, TimeStrikesHistory, SlowFastResult } from '../interfaces/op-energy.interface';
import { StateService } from '../../services/state.service';

import { WebsocketResponse, IBackendInfo } from '../../interfaces/websocket.interface';
import { OpEnergyWebsocketResponse } from '../interfaces/websocket.interface';
import { take, switchMap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class OpEnergyApiService {
  accountTokenState: 'init' | 'checked' | 'generated' = 'init'; // this flag is being used to check if frontend should ask to generate account id hash
  $showAccountURLWarning: ReplaySubject<boolean> = new ReplaySubject<boolean>( 1); // this flag is being used to check if frontend should display WARNING message
  $accountSecret: ReplaySubject<string> = new ReplaySubject(1); // this value will only be used if user haven't specified it
  $accountToken: ReplaySubject<string> = new ReplaySubject(1); // this value is an API token
  timeStrikes$ = new ReplaySubject<TimeStrike>(1);
  timeSlowFastGuesses$ = new ReplaySubject<SlowFastGuess>(1);
  timeSlowFastGuessesOutcome$ = new ReplaySubject<SlowFastGuessOutcome>(1);


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

  // callback which will be called by websocket service
  handleWebsocketResponse( response: OpEnergyWebsocketResponse) {
    if( response.checkedAccountToken) {
      this.accountTokenState = 'checked';
      this.$accountToken.next( response.checkedAccountToken);
      this.$showAccountURLWarning.next( false);
    }
    if( response.generatedAccountSecret  && response.generatedAccountToken) {
      this.accountTokenState = 'generated';
      this.$accountSecret.next( response.generatedAccountSecret);
      this.$accountToken.next( response.generatedAccountToken);
      this.$showAccountURLWarning.next( true);
    }
    if ( response.timeStrike) {
      const ts = response.timeStrike;
      this.timeStrikes$.next( ts);
    }
    if ( response.timeSlowFastGuess) {
      const slowFastGuess = response.timeSlowFastGuess;
      this.timeSlowFastGuesses$.next( slowFastGuess);
    }
    if ( response.timeSlowFastGuessOutcome) {
      const slowFastGuessOutcome = response.timeSlowFastGuessOutcome;
      this.timeSlowFastGuessesOutcome$.next( slowFastGuessOutcome);
    }
  }

  // adds blocked, locked by time by current user
  // params:
  // - blockHeight - height of the block
  // - nlocktime - time, by which lock is being blocked
  // returns TimeStrike value in case of success or throws error otherwise
  $addTimeStrike( blockHeight: number, nlocktime: number): Observable<TimeStrike> {
    var accountToken;
    // get account token from the state service
    let subscription = this.$accountToken.subscribe( newAccountToken => {
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
    return this.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
      let params = {
        account_token: newAccountToken,
      };

      return this.httpClient.get<TimeStrike[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strike/mediantime', {params});
    }));
  }
  // returns list of available locked blocks for a given block height or throws error in case of failure
  $listTimeStrikesByBlockHeight( blockHeight: number): Observable<TimeStrike[]> {
    return this.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
      let params = {
        account_token: newAccountToken,
        block_height: blockHeight,
      };

      return this.httpClient.get<TimeStrike[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/strike/block/mediantime', {params});
    }));
  }
  // this function returns an observable with value of type SlowFastGuess, meaning, that the guess had been persisted in the DB
  // params:
  // - guess: "slow" or "fast"
  // - lockedBlockHeight: height of the locked block number
  // - medianSeconds: value of locked block's median time to guess
  $slowFastGuess( guess: "slow" | "fast", timeStrike: TimeStrike): Observable<SlowFastGuess> {
    return this.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
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
    return this.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {

      let params = {
        account_token: newAccountToken,
        block_height: timeStrike.blockHeight,
        nlocktime: timeStrike.nLockTime,
      };

      return this.httpClient.get<SlowFastGuess[]>(this.apiBaseUrl + this.apiBasePath + '/api/v1/slowfastguess/mediantime', {params});
    }));
  }

  // updates displayable user name for a current user
  // params:
  // - guess: "slow" or "fast"
  // - lockedBlockHeight: height of the locked block number
  // - medianSeconds: value of locked block's median time to guess
  $updateUserDisplayName( displayName: string): Observable<string> {
    return this.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
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
    return this.$accountToken.pipe( take(1)).pipe( switchMap( newAccountToken => {
      let params = {
        account_token: newAccountToken,
        block_height: timeStrikesHistory.blockHeight,
        nlocktime: timeStrikesHistory.nLockTime,
      };

      return this.httpClient.get<SlowFastResult | null>(this.apiBaseUrl + this.apiBasePath + '/api/v1/slowfastresults/mediantime', {params});
    }));
  }

}
