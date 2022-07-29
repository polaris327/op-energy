import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxEchartsModule } from 'ngx-echarts';
import { FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';

import { FutureBlockComponent } from './components/future-block/future-block.component';
import { PastBlocksComponent } from './components/past-blocks/past-blocks.component';
import { StartComponent } from './components/start/start.component';
import { StartV2Component } from './components/start-v2/start-v2.component';
import { OpEnergyApiService } from './services/op-energy.service';
import { ElectrsApiService } from './services/electrs-api.service';
import { TransactionComponent } from './components/transaction/transaction.component';
import { TransactionsListComponent } from './components/transactions-list/transactions-list.component';
import { AmountComponent } from './components/amount/amount.component';
import { StateService } from './services/state.service';
import { BlockComponent } from './components/block/block.component';
import { ParimutuelBetComponent } from './components/parimutuel-bet/parimutuel-bet.component';
import { AddressComponent } from './components/address/address.component';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { LatestBlocksComponent } from './components/latest-blocks/latest-blocks.component';
import { WebsocketService } from './services/websocket.service';
import { AddressLabelsComponent } from './components/address-labels/address-labels.component';
import { MempoolBlocksComponent } from './components/mempool-blocks/mempool-blocks.component';
import { MasterPageComponent } from './components/master-page/master-page.component';
import { BisqMasterPageComponent } from './components/bisq-master-page/bisq-master-page.component';
import { LiquidMasterPageComponent } from './components/liquid-master-page/liquid-master-page.component';
import { AboutComponent } from './components/about/about.component';
import { TelevisionComponent } from './components/television/television.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { BlockchainBlocksComponent } from './components/blockchain-blocks/blockchain-blocks.component';
import { BlockchainComponent } from './components/blockchain/blockchain.component';
import { BlockchainBetsComponent } from './components/blockchain-bets/blockchain-bets.component';
import { BlockchainObservedBlocksComponent } from './components/blockchain-observed-blocks/blockchain-observed-blocks.component';
import { BlockspansHomeComponent } from './components/blockspans-home/blockspans-home.component';
import { BlockspansHomeAddstrikeComponent } from './components/blockspans-home-addstrike/blockspans-home-addstrike.component';
import { FooterComponent } from './components/footer/footer.component';
import { AudioService } from './services/audio.service';
import { MempoolBlockComponent } from './components/mempool-block/mempool-block.component';
import { FeeDistributionGraphComponent } from './components/fee-distribution-graph/fee-distribution-graph.component';
import { IncomingTransactionsGraphComponent } from './components/incoming-transactions-graph/incoming-transactions-graph.component';
import { TimeSpanComponent } from './components/time-span/time-span.component';
import { SeoService } from './services/seo.service';
import { MempoolGraphComponent } from './components/mempool-graph/mempool-graph.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { PoolRankingComponent } from './components/pool-ranking/pool-ranking.component';
import { LbtcPegsGraphComponent } from './components/lbtc-pegs-graph/lbtc-pegs-graph.component';
import { AssetComponent } from './components/asset/asset.component';
import { AssetsComponent } from './assets/assets.component';
import { StatusViewComponent } from './components/status-view/status-view.component';
import { MinerComponent } from './components/miner/miner.component';
import { SharedModule } from './shared/shared.module';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { FeesBoxComponent } from './components/fees-box/fees-box.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DifficultyComponent } from './components/difficulty/difficulty.component';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faFilter, faAngleDown, faAngleUp, faAngleRight, faAngleLeft, faBolt, faChartArea, faCogs, faCubes, faHammer, faDatabase, faExchangeAlt, faInfoCircle,
  faLink, faList, faSearch, faCaretUp, faCaretDown, faTachometerAlt, faThList, faTint, faTv, faAngleDoubleDown, faSortUp, faAngleDoubleUp, faChevronDown, faFileAlt,
  faRedoAlt, faArrowAltCircleRight, faExternalLinkAlt, faBook, faListUl, faFire, faSnowflake, faBurn
} from '@fortawesome/free-solid-svg-icons';
import { ApiDocsComponent } from './components/docs/api-docs.component';
import { DocsComponent } from './components/docs/docs.component';
import { ApiDocsNavComponent } from './components/docs/api-docs-nav.component';
import { CodeTemplateComponent } from './components/docs/code-template.component';
import { TermsOfServiceComponent } from './components/terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TrademarkPolicyComponent } from './components/trademark-policy/trademark-policy.component';
import { StorageService } from './services/storage.service';
import { HttpCacheInterceptor } from './services/http-cache.interceptor';
import { LanguageService } from './services/language.service';
import { SponsorComponent } from './components/sponsor/sponsor.component';
import { PushTransactionComponent } from './components/push-transaction/push-transaction.component';
import { BetPieChartComponent } from './components/bet-pie-chart/bet-pie-chart.component';
import { SetAccountSecretComponent } from './components/setaccountsecret/setaccountsecret.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TenminBetComponent } from './components/tenmin-bet/tenmin-bet.component';
import { TenminBlockComponent } from './components/tenmin-block/tenmin-block.component';
import { ObservedBlockComponent } from './components/observed-block/observed-block.component';
import { ObservedBlockDetailComponent } from './components/observed-block-detail/observed-block-detail.component';
import { ObservedBlockspanDetailComponent } from './components/observed-blockspan-detail/observed-blockspan-detail.component';
import { StrikeDetailComponent } from './components/strike-detail/strike-detail.component';
import { TetrisBlockspanComponent } from './components/tetris-blockspan/tetris-blockspan.component';
import { TetrisBlockspanWaterComponent } from './components/tetris-blockspan-water/tetris-blockspan-water.component';
import { TetrisBlockspanStrikeComponent } from './components/tetris-blockspan-strike/tetris-blockspan-strike.component';
import { TetrisBlockspanNavigatorComponent } from './components/tetris-blockspan-navigator/tetris-blockspan-navigator.component';
import { TetrisAddStrikeComponent } from './components/tetris-add-strike/tetris-add-strike.component';
import { PreviewComponent } from './components/preview/preview.component';

@NgModule({
  declarations: [
    AppComponent,
    FutureBlockComponent,
    PastBlocksComponent,
    AboutComponent,
    MasterPageComponent,
    BisqMasterPageComponent,
    LiquidMasterPageComponent,
    TelevisionComponent,
    BlockchainComponent,
    BlockchainBetsComponent,
    BlockchainObservedBlocksComponent,
    BlockspansHomeComponent,
    BlockspansHomeAddstrikeComponent,
    StartComponent,
    StartV2Component,
    BlockchainBlocksComponent,
    StatisticsComponent,
    TransactionComponent,
    BlockComponent,
    ParimutuelBetComponent,
    TransactionsListComponent,
    AddressComponent,
    AmountComponent,
    LatestBlocksComponent,
    SearchFormComponent,
    TimeSpanComponent,
    AddressLabelsComponent,
    MempoolBlocksComponent,
    FooterComponent,
    MempoolBlockComponent,
    FeeDistributionGraphComponent,
    IncomingTransactionsGraphComponent,
    MempoolGraphComponent,
    LineChartComponent,
    PoolRankingComponent,
    LbtcPegsGraphComponent,
    AssetComponent,
    AssetsComponent,
    MinerComponent,
    StatusViewComponent,
    FeesBoxComponent,
    DashboardComponent,
    DifficultyComponent,
    ApiDocsComponent,
    CodeTemplateComponent,
    TermsOfServiceComponent,
    PrivacyPolicyComponent,
    TrademarkPolicyComponent,
    SponsorComponent,
    PushTransactionComponent,
    DocsComponent,
    ApiDocsNavComponent,
    TenminBetComponent,
    TenminBlockComponent,
    ObservedBlockComponent,
    ObservedBlockDetailComponent,
    ObservedBlockspanDetailComponent,
    StrikeDetailComponent,
    BetPieChartComponent,
    TetrisBlockspanComponent,
    TetrisBlockspanWaterComponent,
    TetrisBlockspanStrikeComponent,
    TetrisBlockspanNavigatorComponent,
    TetrisAddStrikeComponent,
    PreviewComponent,
    SetAccountSecretComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    InfiniteScrollModule,
    NgbTypeaheadModule,
    NgbModule,
    FontAwesomeModule,
    SharedModule,
    FormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    ToastrModule.forRoot()
  ],
  providers: [
    OpEnergyApiService,
    ElectrsApiService,
    StateService,
    WebsocketService,
    AudioService,
    SeoService,
    StorageService,
    LanguageService,
    { provide: HTTP_INTERCEPTORS, useClass: HttpCacheInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faInfoCircle);
    library.addIcons(faChartArea);
    library.addIcons(faTv);
    library.addIcons(faTachometerAlt);
    library.addIcons(faCubes);
    library.addIcons(faHammer);
    library.addIcons(faCogs);
    library.addIcons(faThList);
    library.addIcons(faList);
    library.addIcons(faTachometerAlt);
    library.addIcons(faDatabase);
    library.addIcons(faSearch);
    library.addIcons(faLink);
    library.addIcons(faBolt);
    library.addIcons(faTint);
    library.addIcons(faFilter);
    library.addIcons(faAngleDown);
    library.addIcons(faAngleUp);
    library.addIcons(faExchangeAlt);
    library.addIcons(faAngleDoubleUp);
    library.addIcons(faAngleDoubleDown);
    library.addIcons(faChevronDown);
    library.addIcons(faFileAlt);
    library.addIcons(faRedoAlt);
    library.addIcons(faArrowAltCircleRight);
    library.addIcons(faExternalLinkAlt);
    library.addIcons(faSortUp);
    library.addIcons(faCaretUp);
    library.addIcons(faCaretDown);
    library.addIcons(faAngleRight);
    library.addIcons(faAngleLeft);
    library.addIcons(faBook);
    library.addIcons(faListUl);
    library.addIcons(faFire);
    library.addIcons(faSnowflake);
    library.addIcons(faBurn);
  }
}
