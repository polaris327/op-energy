import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgModule, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { forkJoin, Observable, Subscription, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Block } from 'src/app/interfaces/electrs.interface';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { specialBlocks } from 'src/app/app.constants';
import { ElectrsApiService } from 'src/app/services/electrs-api.service';
import { switchMap, skip, map } from 'rxjs/operators';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';
import { OpEnergyApiService } from 'src/app/services/op-energy.service';
import { TimeStrike } from 'src/app/interfaces/op-energy.interface';

interface PastBlock extends Block {
  mediantimeDiff: number;
}

@Component({
  selector: 'app-blockspans-home',
  templateUrl: './blockspans-home.component.html',
  styleUrls: ['./blockspans-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockspansHomeComponent implements OnInit, OnDestroy {
  specialBlocks = specialBlocks;
  network = '';
  allBlocks: PastBlock[] = [];
  pastBlocks: PastBlock[] = [];
  indexArray = [1, 3, 5, 7, 9, 11];
  lastPastBlock: PastBlock;
  emptyBlocks: Block[] = this.mountEmptyBlocks();
  markHeight: number;
  subscription: Subscription;
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

  span = 1;  

  gradientColors = {
    '': ['#9339f4', '#105fb0'],
    bisq: ['#9339f4', '#105fb0'],
    liquid: ['#116761', '#183550'],
    'liquidtestnet': ['#494a4a', '#272e46'],
    testnet: ['#1d486f', '#183550'],
    signet: ['#6f1d5d', '#471850'],
  };

  mouseDragStartX: number;
  blockchainScrollLeftInit: number;
  @ViewChild('blockchainContainer') blockchainContainer: ElementRef;

  getMedianTimePosixTooltip(block: PastBlock) {
    const matchBlock = this.allBlocks.find(b => b.timestamp === block.mediantime);
    const matchBlockHeight = matchBlock?.height || block.height - 5; // hacky solution. Need to get the exact match block
    return `Median of posix times from blocks ${block.height - this.stateService.env.KEEP_BLOCKS_AMOUNT + 1} to ${block.height}. matches time (posix) of block ${matchBlockHeight}`;
  }

  get timePosixTooltip() {
    return 'Seconds since midnight, January 1 1970, as recorded in block by bitcoin miners';
  }

  timeStrikes: TimeStrike[] = [];
  initStrike = 1200;

  constructor(
    private location: Location,
    private toastr: ToastrService,
    public stateService: StateService,
    private route: ActivatedRoute,
    private router: Router,
    private relativeUrlPipe: RelativeUrlPipe,
    private cd: ChangeDetectorRef,
    private electrsApiService: ElectrsApiService,
    private opEnergyApiService: OpEnergyApiService
  ) { }

  ngOnInit() {
    this.emptyBlocks.forEach((b) => this.emptyBlockStyles.push(this.getStyleForEmptyBlock(b)));
    this.loadingBlocks$ = this.stateService.isLoadingWebSocket$;
    this.networkSubscription = this.stateService.networkChanged$.subscribe((network) => this.network = network);
    this.tabHiddenSubscription = this.stateService.isTabHidden$.subscribe((tabHidden) => this.tabHidden = tabHidden);

    this.markBlockSubscription = this.stateService.markBlock$
      .subscribe((state) => {
        this.markHeight = undefined;
        if (state.blockHeight) {
          this.markHeight = state.blockHeight;
        }
        this.moveArrowToPosition(false);
        this.cd.markForCheck();
      });

    for (let i = 0; i < this.indexArray.length; i++) {
      this.blockStyles.push(this.getStyleForBlock(i));
    }            

    this.subscription = this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        params.get('tip') 
        ? of({...params})
        : this.stateService.blocks$.pipe(
            skip(11),
            map(block => ({
              ...params,
              tip: block[0].height
            }))
          ))
    ).subscribe((params: any) => {
      const span: string = params.params.span || '';
      const tip: string = params.params.tip || params.tip || '';
      this.blockspanChange({
        tipBlock: +tip,
        span: +span
      });  
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.networkSubscription.unsubscribe();
    this.tabHiddenSubscription.unsubscribe();
    this.markBlockSubscription.unsubscribe();
  }

  blockspanChange({tipBlock, span}) {
    this.span = span;
    let blockNumbers = [];
    let lastblock = tipBlock;
    for (let i = 0; i < this.stateService.env.KEEP_BLOCKS_AMOUNT; i += 2) {
      blockNumbers.push(lastblock, lastblock - span);
      lastblock = lastblock - (span + 1);
    }
    this.pastBlocks = [];
    forkJoin(
      blockNumbers.map(
        blockNo => this.electrsApiService.getBlockHashFromHeight$(blockNo).pipe(
          switchMap(hash => this.electrsApiService.getBlock$(hash))
        )
      )
    ).subscribe((blocks: any[]) => {
      this.pastBlocks = blocks;
      this.lastPastBlock = this.pastBlocks[0];
      this.lastPastBlock = {
        ...this.lastPastBlock,
        height: this.lastPastBlock.height + 1
      };
      this.location.replaceState(
        this.router.createUrlTree([(this.network ? '/' + this.network : '') + `/tetris/blockspans/`, this.span, tipBlock]).toString()
      );

      this.getTimeStrikes();
    }, error => {
      this.toastr.error('Blockspans are not found!', 'Failed!');
    });
  }

  getTimeStrikes() {
    this.opEnergyApiService.$listTimeStrikes()
      .subscribe((timeStrikes: TimeStrike[]) => {
        this.timeStrikes = timeStrikes.map(strike => ({
          ...strike,
          elapsedTime: strike.nLockTime - this.pastBlocks[0].mediantime
        }));
        const existingElapsedTimes = this.timeStrikes.map(s => s.elapsedTime);
        while (existingElapsedTimes.includes(this.initStrike)) {
          this.initStrike += 1;
        }
      });
  }

  onMouseDown(event: MouseEvent) {
    this.mouseDragStartX = event.clientX;
    this.blockchainScrollLeftInit = this.blockchainContainer.nativeElement.scrollLeft;
  }
  onDragStart(event: MouseEvent) { // Ignore Firefox annoying default drag behavior
    event.preventDefault();
  }

  // We're catching the whole page event here because we still want to scroll blocks
  // even if the mouse leave the blockchain blocks container. Same idea for mouseup below.
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.mouseDragStartX != null) {
      this.stateService.setBlockScrollingInProgress(true);
      this.blockchainContainer.nativeElement.scrollLeft =
        this.blockchainScrollLeftInit + this.mouseDragStartX - event.clientX
    }
  }
  @HostListener('document:mouseup', [])
  onMouseUp() {
    this.mouseDragStartX = null;
    this.stateService.setBlockScrollingInProgress(false);
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

  getStyleForBlock(index: number) {
    return {
      left: 250 + 295 * (index + 1) + 'px',
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

  goDetail(fromBlock, toBlock) {
    this.router.navigate([this.relativeUrlPipe.transform('/tetris/blockspan/'), fromBlock.height, toBlock.height]);
  }

  addStrike(strike) {
    const nLockTime = this.pastBlocks[0].mediantime + Number(strike.elapsedTime);
    this.opEnergyApiService.$addTimeStrike(strike.blockHeight, nLockTime)
      .subscribe(timeStrike => {
        this.getTimeStrikes();
        this.toastr.success('A strike has been added successfully!', 'Success!');
      }, err => {
        this.toastr.error('Error occurred!', 'Failed!');
      });
  }
}
