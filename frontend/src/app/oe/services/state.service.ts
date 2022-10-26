import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Subject, fromEvent, Observable } from 'rxjs';
import { HttpParams, HttpClient } from '@angular/common/http';
import { TimeStrike, SlowFastGuess, SlowFastGuessOutcome, TimeStrikesHistory, SlowFastResult } from '../interfaces/op-energy.interface';
import { StateService } from '../../services/state.service';
import { WebsocketService } from 'src/app/services/websocket.service';

import { WebsocketResponse, IBackendInfo } from '../../interfaces/websocket.interface';
import { OpEnergyWebsocketResponse } from '../interfaces/websocket.interface';
import { take, switchMap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class OeStateService {
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
  handleWebsocketResponse( websocketService: WebsocketService, response: OpEnergyWebsocketResponse) {
    if( response.declinedAccountSecret) {
      websocketService.want(['generatedaccounttoken']);
    }
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

}
