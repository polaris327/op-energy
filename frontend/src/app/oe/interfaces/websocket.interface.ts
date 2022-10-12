import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WebsocketResponse, IBackendInfo } from '../../interfaces/websocket.interface';
import { take } from 'rxjs/operators';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { TimeStrike, SlowFastGuess, SlowFastGuessOutcome } from './op-energy.interface';


export interface OpEnergyWebsocketResponse extends WebsocketResponse {
  'track-time-strikes'?: 'start' | 'stop';
  'track-time-strike-start'?: TimeStrike;
  'track-time-strike-stop'?: TimeStrike;
  timeStrike?: TimeStrike;
  timeSlowFastGuess?: SlowFastGuess;
  timeSlowFastGuessOutcome?: SlowFastGuessOutcome;
  generatedAccountSecret?: string;
  generatedAccountToken?: string;
  checkedAccountToken?: string;
  declinedAccountSecret?: string;
}
