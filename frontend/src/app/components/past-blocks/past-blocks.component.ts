import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgModule } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Block } from 'src/app/interfaces/electrs.interface';
import { StateService } from 'src/app/services/state.service';
import { Router } from '@angular/router';
import { specialBlocks } from 'src/app/app.constants';

interface PastBlock extends Block {
  mediantimeDiff: number;
}

@Component({
  selector: 'app-past-blocks',
  templateUrl: './past-blocks.component.html',
  styleUrls: ['./past-blocks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastBlocksComponent implements OnInit, OnDestroy {
  specialBlocks = specialBlocks;
  network = '';
  allBlocks: PastBlock[] = [];
  pastBlocks: PastBlock[] = [];
  lastPastBlock: PastBlock;
  emptyBlocks: Block[] = this.mountEmptyBlocks();
  markHeight: number;
  blocksSubscription: Subscription;
  networkSubscription: Subscription;
  tabHiddenSubscription: Subscription;
  markBlockSubscription: Subscription;
  loadingBlocks$: Observable<boolean>;
  blockStyles = [];
  emptyBlockStyles = [];
  tabHidden = false;
  arrowVisible = false;
  arrowLeftPx = 30;
  blocksFilled = false;
  transition = '1s';

  gradientColors = {
    '': ['#9339f4', '#105fb0'],
    bisq: ['#9339f4', '#105fb0'],
    liquid: ['#116761', '#183550'],
    'liquidtestnet': ['#494a4a', '#272e46'],
    testnet: ['#1d486f', '#183550'],
    signet: ['#6f1d5d', '#471850'],
  };

  getMedianTimePosixTooltip(block: PastBlock) {
    const matchBlock = this.allBlocks.find(b => b.timestamp === block.mediantime);
    const matchBlockHeight = matchBlock?.height || block.height - 5; // hacky solution. Need to get the exact match block
    return `Median of posix times from blocks ${block.height - this.stateService.env.KEEP_BLOCKS_AMOUNT + 1} to ${block.height}. matches time (posix) of block ${matchBlockHeight}`;
  }

  get timePosixTooltip() {
    return 'Seconds since midnight, January 1 1970, as recorded in block by bitcoin miners';
  }

  constructor(
    public stateService: StateService,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.emptyBlocks.forEach((b) => this.emptyBlockStyles.push(this.getStyleForEmptyBlock(b)));
    this.loadingBlocks$ = this.stateService.isLoadingWebSocket$;
    this.networkSubscription = this.stateService.networkChanged$.subscribe((network) => this.network = network);
    this.tabHiddenSubscription = this.stateService.isTabHidden$.subscribe((tabHidden) => this.tabHidden = tabHidden);
    this.blocksSubscription = this.stateService.blocks$
      .subscribe(([block, txConfirmed]) => {
        if (this.pastBlocks.some((b) => b.height === block.height)) {
          return;
        }

        if (this.pastBlocks.length && block.height !== this.pastBlocks[0].height + 1) {
          this.allBlocks = [];
          this.pastBlocks = [];
          this.blocksFilled = false;
        }

        var pastBlock: PastBlock = <PastBlock> block;
        pastBlock.mediantimeDiff = 0;
        if( this.pastBlocks.length > 0) {
          pastBlock.mediantimeDiff = block.mediantime - this.pastBlocks[0].mediantime;
        }
        this.lastPastBlock = pastBlock;
        this.pastBlocks.unshift( pastBlock);
        this.allBlocks = [...this.pastBlocks];
        // we need this.stateService.env.KEEP_BLOCKS_AMOUNT + 1 in order to keep block information next to the end, because the very first block has mediantimeDiff = 0. This block will be cutted off below, but needs to be used to calculate mediantimeDiff of the blocks, that will actually be displayed
        this.pastBlocks = this.pastBlocks.slice( 0, this.stateService.env.KEEP_BLOCKS_AMOUNT + 1);

        if (this.blocksFilled && !this.tabHidden) {
          block.stage = block.matchRate >= 66 ? 1 : 2;
        }

        if (txConfirmed) {
          this.markHeight = block.height;
          this.moveArrowToPosition(true, true);
        } else {
          this.moveArrowToPosition(true, false);
        }

        this.blockStyles = [];
        this.pastBlocks.forEach( (pastBlock, index) => {
          this.blockStyles.push(this.getStyleForBlock(pastBlock, index));
        });

        if (this.pastBlocks.length === this.stateService.env.KEEP_BLOCKS_AMOUNT + 1) {
          this.blocksFilled = true;
          this.pastBlocks = this.pastBlocks.slice( 0, this.stateService.env.KEEP_BLOCKS_AMOUNT); // slice array to the size that actually needed
        }
        this.cd.markForCheck();
      });

    this.markBlockSubscription = this.stateService.markBlock$
      .subscribe((state) => {
        this.markHeight = undefined;
        if (state.blockHeight) {
          this.markHeight = state.blockHeight;
        }
        this.moveArrowToPosition(false);
        this.cd.markForCheck();
      });
  }

  ngOnDestroy() {
    this.blocksSubscription.unsubscribe();
    this.networkSubscription.unsubscribe();
    this.tabHiddenSubscription.unsubscribe();
    this.markBlockSubscription.unsubscribe();
  }

  moveArrowToPosition(animate: boolean, newBlockFromLeft = false) {
    if (!this.markHeight) {
      this.arrowVisible = false;
      return;
    }
    const blockindex = this.pastBlocks.findIndex((b) => b.height === this.markHeight);
    if (blockindex > -1) {
      if (!animate) {
        this.transition = 'inherit';
      }
      this.arrowVisible = true;
      if (newBlockFromLeft) {
        this.arrowLeftPx = blockindex * 195 + 30 - 205;
        setTimeout(() => {
          this.transition = '2s';
          this.arrowLeftPx = blockindex * 195 + 30;
          this.cd.markForCheck();
        }, 50);
      } else {
        this.arrowLeftPx = blockindex * 195 + 30;
        if (!animate) {
          setTimeout(() => {
            this.transition = '2s';
            this.cd.markForCheck();
          });
        }
      }
    }
  }

  trackByBlocksFn(index: number, item: Block) {
    return item.height;
  }
  trackByPastBlocksFn(index: number, item: PastBlock) {
    return item.height;
  }

  getStyleForBlock(block: PastBlock, index: number) {
    const greenBackgroundHeight = (block.weight / this.stateService.env.BLOCK_WEIGHT_UNITS) * 100;
    let addLeft = 0;

    if (block.stage === 1) {
      block.stage = 2;
      addLeft = -205;
    }

    return {
      left: 195 * index + 'px',
      background: `repeating-linear-gradient(
        #2d3348,
        #2d3348 ${greenBackgroundHeight}%,
        ${this.gradientColors[this.network][0]} ${Math.max(greenBackgroundHeight, 0)}%,
        ${this.gradientColors[this.network][1]} 100%
      )`,
    };
  }

  getStyleForEmptyBlock(block: Block) {
    let addLeft = 0;

    if (block.stage === 1) {
      block.stage = 2;
      addLeft = -205;
    }

    return {
      left: addLeft + 195 * this.emptyBlocks.indexOf(block) + 'px',
      background: "#2d3348",
    };
  }

  mountEmptyBlocks() {
    const emptyBlocks = [];
    for (let i = 0; i < this.stateService.env.KEEP_BLOCKS_AMOUNT; i++) {
      emptyBlocks.push({
        id: '',
        height: 0,
        version: 0,
        timestamp: 0,
        bits: 0,
        nonce: 0,
        difficulty: 0,
        merkle_root: '',
        tx_count: 0,
        size: 0,
        weight: 0,
        previousblockhash: '',
        matchRate: 0,
        stage: 0,
      });
    }
    return emptyBlocks;
  }

  isTipBlock(block: Block) {
    return block.mediantime === this.lastPastBlock.mediantime;
  }

  isMedianBlock(block: Block) {
    return block.timestamp === this.lastPastBlock.mediantime;
  }
}
