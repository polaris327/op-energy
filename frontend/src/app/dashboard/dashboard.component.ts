import { ChangeDetectionStrategy, Component, Inject, LOCALE_ID, OnInit, OnDestroy } from '@angular/core';
import { combineLatest, merge, Observable, of, timer, Subscription } from 'rxjs';
import { filter, map, scan, share, switchMap, tap } from 'rxjs/operators';
import { Block } from '../interfaces/electrs.interface';
import { OptimizedMempoolStats } from '../interfaces/node-api.interface';
import { MempoolInfo, TransactionStripped } from '../interfaces/websocket.interface';
import { ApiService } from '../services/api.service';
import { StateService } from '../services/state.service';
import { WebsocketService } from '../services/websocket.service';
import { SeoService } from '../services/seo.service';
import { StorageService } from '../services/storage.service';

interface MempoolBlocksData {
  blocks: number;
  size: number;
}

interface MempoolInfoData {
  memPoolInfo: MempoolInfo;
  vBytesPerSecond: number;
  progressWidth: string;
  progressColor: string;
}

interface MempoolStatsData {
  mempool: OptimizedMempoolStats[];
  weightPerSecond: any;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  collapseLevel: string;
  network$: Observable<string>;
  mempoolBlocksData$: Observable<MempoolBlocksData>;
  mempoolInfoData$: Observable<MempoolInfoData>;
  lastDifficultyEpochEndBlocks: Block[];
  lastDifficultyEpochEndBlocksSubscription: Subscription;
  lastDifficultyEpochEndBlocksSeries: any;
  mempoolLoadingStatus$: Observable<number>;
  vBytesPerSecondLimit = 1667;
  latestBlockHeight: number;
  mempoolTransactionsWeightPerSecondData: any;
  isLoadingWebSocket$: Observable<boolean>;
  liquidPegsMonth$: Observable<any>;
  difficultySliderStartValue: number = 0; // those 2 variables contain start / end values for difficulty chart slider
  difficultySliderEndValue: number = 0;

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    public stateService: StateService,
    private apiService: ApiService,
    private websocketService: WebsocketService,
    private seoService: SeoService,
    private storageService: StorageService,
  ) { }

  ngOnDestroy() {
    this.lastDifficultyEpochEndBlocksSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.lastDifficultyEpochEndBlocks = [];
    this.lastDifficultyEpochEndBlocksSubscription = this.stateService.lastDifficultyEpochEndBlocks$
      .subscribe(([block, txConfirmed]) => {
        this.lastDifficultyEpochEndBlocks.push( block);
        if( this.lastDifficultyEpochEndBlocks.length > 0){
          if(this.lastDifficultyEpochEndBlocks.length <= 30) {
            this.difficultySliderStartValue = this.lastDifficultyEpochEndBlocks[0].height;
            this.difficultySliderEndValue = this.lastDifficultyEpochEndBlocks[ this.lastDifficultyEpochEndBlocks.length - 1].height;
          }else{
            this.difficultySliderStartValue = this.lastDifficultyEpochEndBlocks[ this.lastDifficultyEpochEndBlocks.length - 30].height;
            this.difficultySliderEndValue = this.lastDifficultyEpochEndBlocks[ this.lastDifficultyEpochEndBlocks.length - 1].height;
          }
        }
        let map = new Map<number, string>();
        this.lastDifficultyEpochEndBlocks.map((block) => {
          const block_date = new Date( block.timestamp * 1000);
          const month_real = block_date.getMonth() + 1;
          const month = (month_real < 10) ? '0' + String(month_real) : month_real;
          const day = (block_date.getDate() < 10) ? '0' + String(block_date.getDate()) : block_date.getDate();
          map.set( block.height, String(block.height) + '\n'
            + block_date.getFullYear() + '/' + month + '/' + day);
        });
        this.lastDifficultyEpochEndBlocksSeries = {
          labels: map,
          series: [this.lastDifficultyEpochEndBlocks.map((block)=> [ block.height, block.difficulty])]
        };
      });
    this.isLoadingWebSocket$ = this.stateService.isLoadingWebSocket$;
    this.seoService.resetTitle();
    this.websocketService.want(['blocks', 'stats', 'mempool-blocks', 'live-2h-chart']);
    this.network$ = merge(of(''), this.stateService.networkChanged$);
    this.collapseLevel = this.storageService.getValue('dashboard-collapsed') || 'one';
    this.mempoolLoadingStatus$ = this.stateService.loadingIndicators$
      .pipe(
        map((indicators) => indicators.mempool !== undefined ? indicators.mempool : 100)
      );

    this.mempoolInfoData$ = combineLatest([
      this.stateService.mempoolInfo$,
      this.stateService.vbytesPerSecond$
    ])
    .pipe(
      map(([mempoolInfo, vbytesPerSecond]) => {
        const percent = Math.round((Math.min(vbytesPerSecond, this.vBytesPerSecondLimit) / this.vBytesPerSecondLimit) * 100);

        let progressColor = '#7CB342';
        if (vbytesPerSecond > 1667) {
          progressColor = '#FDD835';
        }
        if (vbytesPerSecond > 2000) {
          progressColor = '#FFB300';
        }
        if (vbytesPerSecond > 2500) {
          progressColor = '#FB8C00';
        }
        if (vbytesPerSecond > 3000) {
          progressColor = '#F4511E';
        }
        if (vbytesPerSecond > 3500) {
          progressColor = '#D81B60';
        }

        const mempoolSizePercentage = (mempoolInfo.usage / mempoolInfo.maxmempool * 100);
        let mempoolSizeProgress = 'bg-danger';
        if (mempoolSizePercentage <= 50) {
          mempoolSizeProgress = 'bg-success';
        } else if (mempoolSizePercentage <= 75) {
          mempoolSizeProgress = 'bg-warning';
        }

        return {
          memPoolInfo: mempoolInfo,
          vBytesPerSecond: vbytesPerSecond,
          progressWidth: percent + '%',
          progressColor: progressColor,
          mempoolSizeProgress: mempoolSizeProgress,
        };
      })
    );

    this.mempoolBlocksData$ = this.stateService.mempoolBlocks$
      .pipe(
        map((mempoolBlocks) => {
          const size = mempoolBlocks.map((m) => m.blockSize).reduce((a, b) => a + b, 0);
          const vsize = mempoolBlocks.map((m) => m.blockVSize).reduce((a, b) => a + b, 0);

          return {
            size: size,
            blocks: Math.ceil(vsize / this.stateService.blockVSize)
          };
        })
      );

    if (this.stateService.network === 'liquid' || this.stateService.network === 'liquidtestnet') {
      this.liquidPegsMonth$ = this.apiService.listLiquidPegsMonth$()
        .pipe(
          map((pegs) => {
            const labels = pegs.map(stats => stats.date);
            const series = pegs.map(stats => parseFloat(stats.amount) / 100000000);
            series.reduce((prev, curr, i) => series[i] = prev + curr, 0);
            return {
              series,
              labels
            };
          }),
          share(),
        );
    }
  }

  handleNewMempoolData(mempoolStats: OptimizedMempoolStats[]) {
    mempoolStats.reverse();
    const labels = mempoolStats.map(stats => stats.added);

    return {
      labels: labels,
      series: [mempoolStats.map((stats) => [stats.added * 1000, stats.vbytes_per_second])],
    };
  }

  trackByBlock(index: number, block: Block) {
    return block.height;
  }

  toggleCollapsed() {
    if (this.collapseLevel === 'one') {
      this.collapseLevel = 'two';
    } else if (this.collapseLevel === 'two') {
      this.collapseLevel = 'three';
    } else {
      this.collapseLevel = 'one';
    }
    this.storageService.setValue('dashboard-collapsed', this.collapseLevel);
  }
}
