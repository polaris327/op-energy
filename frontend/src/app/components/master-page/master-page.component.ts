import { Component, OnInit, Inject } from '@angular/core';
import { Env, StateService } from '../../services/state.service';
import { Observable, merge, of, Subscription } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';
import {ActivatedRoute} from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-master-page',
  templateUrl: './master-page.component.html',
  styleUrls: ['./master-page.component.scss'],
})
export class MasterPageComponent implements OnInit {
  env: Env;
  network$: Observable<string>;
  connectionState$: Observable<number>;
  isMobile = window.innerWidth <= 767.98;
  officialMempoolSpace = this.stateService.env.OFFICIAL_MEMPOOL_SPACE;
  urlLanguage: string;

  constructor(
    public stateService: StateService,
    public route: ActivatedRoute,
    private languageService: LanguageService,
    private websocketService: WebsocketService,
    @Inject(DOCUMENT) public document: Document,
  ) { }

  ngOnInit() {
    this.env = this.stateService.env;
    this.connectionState$ = this.stateService.connectionState$;
    this.network$ = merge(of(''), this.stateService.networkChanged$);
    this.urlLanguage = this.languageService.getLanguageForUrl();
  }
  ngAfterContentInit() {
    if( this.stateService.accountTokenState == 'init') {
      this.websocketService.want(['generatedaccounttoken']);
    }
  }

  onResize(event: any) {
    this.isMobile = window.innerWidth <= 767.98;
  }
  closeAccountURLWarning() {
    this.stateService.$accountSecret.next(''); // clean secret value
    this.stateService.$showAccountURLWarning.next( false);
  }
}
