import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { Subscription, Observable, fromEvent, merge, of, combineLatest, timer } from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { Router } from '@angular/router';
import { take, map, switchMap } from 'rxjs/operators';
import { feeLevels, mempoolFeeColors } from 'src/app/app.constants';
import { specialBlocks } from 'src/app/app.constants';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';

@Component({
  selector: 'app-future-block',
  templateUrl: './future-block.component.html',
  styleUrls: ['./future-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FutureBlockComponent implements OnInit, OnDestroy {
  blocksSubscription: Subscription;

  mempoolBlockStyles = [];
  mempoolEmptyBlockStyle = {};
  mempoolBlockStyle = {};
  markBlocksSubscription: Subscription;
  isLoadingWebsocketSubscription: Subscription;
  loadingBlocks$: Observable<boolean>;
  blockSubscription: Subscription;
  networkSubscription: Subscription;
  network = '';
  now = new Date().getTime();

  blockWidth = 125;
  blockPadding = 30;
  arrowVisible = false;
  tabHidden = false;
  feeRounding = '1.0-0';

  rightPosition = 0;
  transition = '2s';

  markIndex: number;
  txFeePerVSize: number;

  resetTransitionTimeout: number;

  blockIndex = 1;

  constructor(
    private router: Router,
    public stateService: StateService,
    private cd: ChangeDetectorRef,
    private relativeUrlPipe: RelativeUrlPipe,
  ) { }

  ngOnInit() {
    if (this.stateService.network === 'liquid' || this.stateService.network === 'liquidtestnet') {
      this.feeRounding = '1.0-1';
    }

    this.stateService.isTabHidden$.subscribe((tabHidden) => this.tabHidden = tabHidden);
    this.loadingBlocks$ = this.stateService.isLoadingWebSocket$;
    this.mempoolBlockStyle = this.getStyleForMempoolBlock();


    this.blockSubscription = this.stateService.blocks$
      .subscribe(([block]) => {
        if (block.matchRate >= 66 && !this.tabHidden) {
          this.blockIndex++;
        }
      });

    this.networkSubscription = this.stateService.networkChanged$
      .subscribe((network) => this.network = network);

  }

  ngOnDestroy() {
    this.blockSubscription.unsubscribe();
    this.networkSubscription.unsubscribe();
  }

  median(numbers: number[]) {
    let medianNr = 0;
    const numsLen = numbers.length;
    if (numsLen % 2 === 0) {
        medianNr = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else {
        medianNr = numbers[(numsLen - 1) / 2];
    }
    return medianNr;
  }

  getStyleForMempoolBlock() {
    const emptyBackgroundSpacePercentage = 0;
    const usedBlockSpace = 100 - emptyBackgroundSpacePercentage;
    const backgroundGradients = [`repeating-linear-gradient(to right,  #554b45, #554b45 ${emptyBackgroundSpacePercentage}%`];
    const gradientColors = [];

    return {
      'right': 40 + 'px',
      'background': backgroundGradients.join(',') + ')'
    };
  }

  getStyleForMempoolEmptyBlock(index: number) {
    return {
      'right': 40 + 'px',
      'background': '#554b45',
    };
  }

  guessSpeedup() {
  }

  guessSpeeddown() {
  }
}
