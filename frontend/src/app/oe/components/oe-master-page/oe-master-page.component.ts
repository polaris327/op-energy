import { Component, Inject, OnInit } from '@angular/core';
import { Env, StateService } from '../../../services/state.service';
import { WebsocketService } from '../../../services/websocket.service';
import { OeStateService } from '../../services/state.service';
import { Observable, merge, of } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';
import { EnterpriseService } from 'src/app/services/enterprise.service';
import { DOCUMENT } from '@angular/common';

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
  public baseUrl: string; // base URL is protocol, hostname, and port
  public basePath: string; // network path is /testnet, etc. or '' for mainnet

  constructor(
    public opEnergyStateService: OeStateService,
    private websocketService: WebsocketService,
    @Inject(DOCUMENT) public document: Document,
    public stateService: StateService,
    private languageService: LanguageService,
    private enterpriseService: EnterpriseService,
  ) {
    this.baseUrl = document.location.protocol + '//' + document.location.host;
    this.basePath = ''; // assume mainnet by default
    this.stateService.networkChanged$.subscribe((network) => {
      if (network === 'bisq') {
        network = '';
      }
      this.basePath = network ? '/' + network : '';
    });
  }

  ngOnInit() {
    this.env = this.stateService.env;
    this.connectionState$ = this.stateService.connectionState$;
    this.network$ = merge(of(''), this.stateService.networkChanged$);
    this.urlLanguage = this.languageService.getLanguageForUrl();
    this.subdomain = this.enterpriseService.getSubdomain();
  }

  ngAfterContentInit() {
    if( this.opEnergyStateService.accountTokenState == 'init') {
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
    this.opEnergyStateService.$accountSecret.next(''); // clean secret value
    this.opEnergyStateService.$showAccountURLWarning.next( false);
  }
}
