import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Block } from '../../interfaces/electrs.interface';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-observed-block',
  templateUrl: './observed-block.component.html',
  styleUrls: ['./observed-block.component.scss']
})
export class ObservedBlockComponent implements OnInit, OnDestroy, OnChanges {
  @Input() pastBlock: Block;
  @Input() blockStyle: any;
  network = '';
  networkSubscription: Subscription;

  gradientColors = {
    '': ['#9339f4', '#105fb0'],
    bisq: ['#9339f4', '#105fb0'],
    liquid: ['#116761', '#183550'],
    'liquidtestnet': ['#494a4a', '#272e46'],
    testnet: ['#1d486f', '#183550'],
    signet: ['#6f1d5d', '#471850'],
  };
 
  constructor(
    public stateService: StateService,
  ) { }

  ngOnInit() {
    this.networkSubscription = this.stateService.networkChanged$.subscribe((network) => {
      this.network = network
    });
  }

  ngOnChanges() {
    if (this.pastBlock && !this.blockStyle) {
      this.blockStyle = this.getStyleForBlock(this.pastBlock);
    }
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
  }

  getStyleForBlock(block: Block) {
    const greenBackgroundHeight = (block.weight / this.stateService.env.BLOCK_WEIGHT_UNITS) * 100;
    let addLeft = 0;

    if (block.stage === 1) {
      block.stage = 2;
      addLeft = -205;
    }

    return {
      background: `repeating-linear-gradient(
        #2d3348,
        #2d3348 ${greenBackgroundHeight}%,
        ${this.gradientColors[this.network][0]} ${Math.max(greenBackgroundHeight, 0)}%,
        ${this.gradientColors[this.network][1]} 100%
      )`,
    };
  }
}
