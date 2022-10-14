import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { WebsocketService } from 'src/app/services/websocket.service';

import { Env, StateService } from '../../../services/state.service';
import { OpEnergyApiService } from '../../services/op-energy.service';
import { Observable, merge, of } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';
import { EnterpriseService } from 'src/app/services/enterprise.service';

@Component({
  selector: 'app-oe-master-page',
  templateUrl: './oe-master-page.component.html',
  styleUrls: ['./oe-master-page.component.scss'],
})
export class OeMasterPageComponent implements OnInit {
  env: Env;
  network$: Observable<string>;
  connectionState$: Observable<number>;
  navCollapsed = false;
  isMobile = window.innerWidth <= 767.98;
  officialMempoolSpace = this.stateService.env.OFFICIAL_MEMPOOL_SPACE;
  urlLanguage: string;
  subdomain = '';

  constructor(
    public stateService: StateService,
    public opEnergyApiService: OpEnergyApiService,
    private languageService: LanguageService,
    private enterpriseService: EnterpriseService,
    private websocketService: WebsocketService,
    @Inject(DOCUMENT) public document: Document,
  ) { }

  ngOnInit() {
    this.env = this.stateService.env;
    this.connectionState$ = this.stateService.connectionState$;
    this.network$ = merge(of(''), this.stateService.networkChanged$);
    this.urlLanguage = this.languageService.getLanguageForUrl();
    this.subdomain = this.enterpriseService.getSubdomain();
  }

  ngAfterContentInit() {
    if( this.opEnergyApiService.accountTokenState == 'init') {
      this.websocketService.want(['generatedaccounttoken']);
    }
  }

  collapse(): void {
    this.navCollapsed = !this.navCollapsed;
  }

  onResize(event: any) {
    this.isMobile = window.innerWidth <= 767.98;
  }
  closeAccountURLWarning() {
    this.opEnergyApiService.$accountSecret.next(''); // clean secret value
    this.opEnergyApiService.$showAccountURLWarning.next( false);
  }

}
