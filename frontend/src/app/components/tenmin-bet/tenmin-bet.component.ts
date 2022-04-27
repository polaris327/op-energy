import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { Block } from '../../interfaces/electrs.interface';
import { StateService } from '../../services/state.service';

interface PastBlock extends Block {
  mediantimeDiff: number;
}

@Component({
  selector: 'app-tenmin-bet',
  templateUrl: './tenmin-bet.component.html',
  styleUrls: ['./tenmin-bet.component.scss']
})
export class TenminBetComponent implements OnInit, OnDestroy {
  @Input() blockStyle: any;
  @Input() block: PastBlock;
  @Input() prevBlock: PastBlock;

  get medianTimeDiff(): number {
    return this.block.mediantime - this.prevBlock.mediantime;
  }

  get blockNumber(): number {
    return this.block.height;
  }

  get nlockTime(): number {
    return this.prevBlock.mediantime + 600;
  }

  get isFast() {
    return this.medianTimeDiff < 600;
  }

  get bgColor() {
    return '#770000';
  }
 
  constructor(
    public stateService: StateService,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
