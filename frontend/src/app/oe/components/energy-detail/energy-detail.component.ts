import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ElectrsApiService } from '../../../services/electrs-api.service';
import { switchMap, tap, debounceTime, catchError, map, take } from 'rxjs/operators';
import { Block, Transaction, Vout } from '../../../interfaces/electrs.interface';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { StateService } from '../../../services/state.service';
import { SeoService } from 'src/app/services/seo.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { TimeStrike } from 'src/app/oe/interfaces/op-energy.interface';
import { OpEnergyApiService } from 'src/app/oe/services/op-energy.service';

@Component({
  selector: 'app-energy-detail',
  templateUrl: './energy-detail.component.html',
  styleUrls: ['./energy-detail.component.scss']
})
export class EnergyDetailComponent implements OnInit, OnDestroy {
  network = '';
  fromBlock: Block;
  toBlock: Block;
  blockHeight: number;
  nextBlockHeight: number;
  fromBlockHash: string;
  toBlockHash: string;
  isLoadingBlock = true;
  latestBlock: Block;
  latestBlocks: Block[] = [];
  transactions: Transaction[];
  isLoadingTransactions = true;
  error: any;
  paginationMaxSize: number;
  coinbaseTx: Transaction;
  page = 1;
  itemsPerPage: number;
  txsLoadingStatus$: Observable<number>;
  showPreviousBlocklink = true;
  showNextBlocklink = true;

  subscription: Subscription;
  keyNavigationSubscription: Subscription;
  blocksSubscription: Subscription;
  networkChangedSubscription: Subscription;

  timeStrikes: TimeStrike[] = [];
  showStrikes: boolean;

  get span(): number {
    return (this.toBlock.height - this.fromBlock.height);
  }

  get timeDiff(): number {
    return this.toBlock.mediantime - this.fromBlock.mediantime;
  }

  get energyDiff(): number {
    return ((this.span * 600 - this.timeDiff) / (this.span * 600)) * 100;
  }

  get chainworkDiff(): bigint {
    if (!this.fromBlock.chainwork || !this.toBlock.chainwork) {
      return BigInt(0);
    }
    return BigInt(this.getHexValue(this.toBlock.chainwork)) - BigInt(this.getHexValue(this.fromBlock.chainwork));
  }

  get hashrate(): bigint {
    if (!this.timeDiff) {
      return BigInt(0);
    }
    return this.chainworkDiff / BigInt(this.timeDiff);
  }

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private modalService: NgbModal,
    private opEnergyApiService: OpEnergyApiService,
    private electrsApiService: ElectrsApiService,
    public stateService: StateService,
    private seoService: SeoService,
    private websocketService: WebsocketService,
    private relativeUrlPipe: RelativeUrlPipe,
  ) { }

  ngOnInit() {
    this.websocketService.want(['blocks', 'mempool-blocks']);
    this.paginationMaxSize = window.matchMedia('(max-width: 670px)').matches ? 3 : 5;
    this.network = this.stateService.network;
    this.itemsPerPage = this.stateService.env.ITEMS_PER_PAGE;

    this.txsLoadingStatus$ = this.route.paramMap
      .pipe(
        switchMap(() => this.stateService.loadingIndicators$),
        map((indicators) => indicators['blocktxs-' + this.fromBlockHash] !== undefined ? indicators['blocktxs-' + this.fromBlockHash] : 0)
      );

    this.blocksSubscription = this.stateService.blocks$
      .subscribe(([block]) => {
        this.latestBlock = block;
        this.latestBlocks.unshift(block);
        this.latestBlocks = this.latestBlocks.slice(0, this.stateService.env.KEEP_BLOCKS_AMOUNT);
        this.setNextAndPreviousBlockLink();

        if (block.id === this.fromBlockHash) {
          this.fromBlock = block;
        }
      });

    this.subscription = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const fromBlockHash: string = params.get('from') || '';
        const toBlockHash: string = params.get('to') || '';
        this.fromBlock = undefined;
        this.toBlock = undefined;
        this.page = 1;
        this.coinbaseTx = undefined;
        this.error = undefined;
        this.stateService.markBlock$.next({});

        if (history.state.data && history.state.data.blockHeight) {
          this.blockHeight = history.state.data.blockHeight;
        }

        let isBlockHeight = false;
        if (/^[0-9]+$/.test(fromBlockHash) && /^[0-9]+$/.test(toBlockHash)) {
          isBlockHeight = true;
        } else {
          this.fromBlockHash = fromBlockHash;
          this.toBlockHash = toBlockHash;
        }
        document.body.scrollTo(0, 0);

        if (history.state.data && history.state.data.block) {
          this.blockHeight = history.state.data.block.height;
          return of([history.state.data.block, history.state.data.block]);
        } else {
          this.isLoadingBlock = true;

          let fromBlockInCache: Block;
          let toBlockInCache: Block;
          if (isBlockHeight) {
            fromBlockInCache = this.latestBlocks.find((block) => block.height === parseInt(fromBlockHash, 10));
            toBlockInCache = this.latestBlocks.find((block) => block.height === parseInt(toBlockHash, 10));
            if (fromBlockInCache && toBlockInCache) {
              return of([fromBlockInCache, toBlockInCache]);
            }
            return combineLatest([
              this.electrsApiService.getBlockHashFromHeight$(parseInt(fromBlockHash, 10)).pipe(
                catchError(() => of(fromBlockHash)),
              ),
              this.electrsApiService.getBlockHashFromHeight$(parseInt(toBlockHash, 10)).pipe(
                catchError(() => of(toBlockHash)),
              )
            ])
              .pipe(
                switchMap(([fromHash, toHash]) => {
                  this.fromBlockHash = fromHash;
                  this.toBlockHash = toHash;
                  this.location.replaceState(
                    this.router.createUrlTree([(this.network ? '/' + this.network : '') + `/hashstrikes/energy_detail/`, fromHash, toHash]).toString()
                  );
                  return combineLatest([
                    this.opEnergyApiService.$getBlock(fromHash).pipe(
                      catchError(() => of(fromHash)),
                    ),
                    this.opEnergyApiService.$getBlock(toHash).pipe(
                      catchError(() => of(toHash)),
                    )
                  ]);
                })
              );
          }

          fromBlockInCache = this.latestBlocks.find((block) => block.id === this.fromBlockHash);
          toBlockInCache = this.latestBlocks.find((block) => block.id === this.toBlockHash);
          if (fromBlockInCache && toBlockInCache) {
            return of([fromBlockInCache, toBlockInCache]);
          }

          return combineLatest([
            this.opEnergyApiService.$getBlock(fromBlockHash).pipe(
              catchError(() => of(fromBlockHash)),
            ),
            this.opEnergyApiService.$getBlock(toBlockHash).pipe(
              catchError(() => of(toBlockHash)),
            )
          ]);
        }
      }),
    )
    .subscribe(([fromBlock, toBlock]: [Block, Block]) => {
      this.fromBlock = fromBlock;
      if (typeof toBlock == 'string') {
        this.toBlock = {
          ...this.fromBlock,
          height: toBlock,
        };
      } else {
        this.toBlock = toBlock;
      }
      this.blockHeight = fromBlock.height;
      this.nextBlockHeight = fromBlock.height + 1;
      this.setNextAndPreviousBlockLink();

      this.seoService.setTitle($localize`:@@block.component.browser-title:Block ${fromBlock.height}:BLOCK_HEIGHT:: ${fromBlock.id}:BLOCK_ID:`);
      this.isLoadingBlock = false;
      if (fromBlock.coinbaseTx) {
        this.coinbaseTx = fromBlock.coinbaseTx;
      }
      this.stateService.markBlock$.next({ blockHeight: this.blockHeight });
      this.isLoadingTransactions = true;
      this.transactions = null;

      this.stateService.$accountToken.pipe(take(1)).subscribe(res => {
        this.getTimeStrikes();
      })
    }),
    (error) => {
      this.error = error;
      this.isLoadingBlock = false;
    };

    this.networkChangedSubscription = this.stateService.networkChanged$
      .subscribe((network) => this.network = network);

    this.keyNavigationSubscription = this.stateService.keyNavigation$.subscribe((event) => {
      if (this.showPreviousBlocklink && event.key === 'ArrowRight' && this.nextBlockHeight - 2 >= 0) {
        this.navigateToPreviousBlock();
      }
      if (event.key === 'ArrowLeft') {
        if (this.showNextBlocklink) {
          this.navigateToNextBlock();
        } else {
          this.router.navigate([this.relativeUrlPipe.transform('/mempool-block'), '0']);
        }
      }
    });
  }

  ngOnDestroy() {
    this.stateService.markBlock$.next({});
    this.subscription.unsubscribe();
    this.keyNavigationSubscription.unsubscribe();
    this.blocksSubscription.unsubscribe();
    this.networkChangedSubscription.unsubscribe();
  }

  getTimeStrikes() {
    this.opEnergyApiService.$listTimeStrikesByBlockHeight(this.toBlock.height)
      .subscribe((timeStrikes: TimeStrike[]) => {
        this.timeStrikes = timeStrikes.map(strike => ({
          ...strike,
          elapsedTime: strike.nLockTime - this.fromBlock.mediantime
        }));
        console.log(111111111, this.timeStrikes)
      });
  }

  onResize(event: any) {
    this.paginationMaxSize = event.target.innerWidth < 670 ? 3 : 5;
  }

  navigateToPreviousBlock() {
    if (!this.fromBlock) {
      return;
    }
    const block = this.latestBlocks.find((b) => b.height === this.nextBlockHeight - 2);
    this.router.navigate([this.relativeUrlPipe.transform('/hashstrikes/energy_detail/'),
      block ? block.id : this.fromBlock.previousblockhash], { state: { data: { block, blockHeight: this.nextBlockHeight - 2 } } });
  }

  navigateToNextBlock() {
    const block = this.latestBlocks.find((b) => b.height === this.nextBlockHeight);
    this.router.navigate([this.relativeUrlPipe.transform('/hashstrikes/energy_detail/'),
      block ? block.id : this.nextBlockHeight], { state: { data: { block, blockHeight: this.nextBlockHeight } } });
  }

  navigateToBlockByNumber() {
    const block = this.latestBlocks.find((b) => b.height === this.blockHeight);
    this.router.navigate([this.relativeUrlPipe.transform('/hashstrikes/energy_detail/'),
      block ? block.id : this.blockHeight], { state: { data: { block, blockHeight: this.blockHeight } } });
  }

  setNextAndPreviousBlockLink(){
    if (this.latestBlock && this.blockHeight) {
      if (this.blockHeight === 0){
        this.showPreviousBlocklink = false;
      } else {
        this.showPreviousBlocklink = true;
      }
      if (this.latestBlock.height && this.latestBlock.height === this.blockHeight) {
        this.showNextBlocklink = false;
      } else {
        this.showNextBlocklink = true;
      }
    }
  }

  open(content) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
    }, (reason) => {
    });
  }

  toHHMMSS(secs) {
    let sec_num = parseInt(secs, 10); // don't forget the second param
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);
    let strHours = hours.toString();
    let strMinutes = minutes.toString();
    let strSeconds = seconds.toString();
    if (hours   < 10) {strHours   = "0"+hours;}
    if (minutes < 10) {strMinutes = "0"+minutes;}
    if (seconds < 10) {strSeconds = "0"+seconds;}
    return strHours+':'+strMinutes+':'+strSeconds;
  }

  getHexValue(str) {
    const arr1 = str.split('');
    const idx = arr1.findIndex(a => a !== '0');
    let hexValue = '0x';
    if (idx > -1) {
      hexValue += str.slice(idx);
    } else {
      hexValue += str;
    }
    return hexValue;
  }

  goDetail(fromBlock, strike) {
    this.router.navigate([this.relativeUrlPipe.transform('/hashstrikes/strike_detail/'), fromBlock.height, strike.blockHeight, strike.blockHeight, strike.nLockTime, strike.creationTime]);
  }

  energyDetailLink() {
    return this.relativeUrlPipe.transform(`/hashstrikes/energy_detail/${this.fromBlock.height}/${this.toBlock.height}`);
  }
}
