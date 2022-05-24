import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Block } from '../../interfaces/electrs.interface';

export const MAX_COUNT = 8;
@Component({
  selector: 'app-tetris-blockspan',
  templateUrl: './tetris-blockspan.component.html',
  styleUrls: ['./tetris-blockspan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisBlockspanComponent implements OnInit, OnDestroy {
  @Input() fromBlock: Block;
  @Input() toBlock: Block;
  maxCount = MAX_COUNT;

  get span(): number {
    return (this.toBlock.height - this.fromBlock.height);
  }

  get timeDiff(): number {
    return this.toBlock.mediantime - this.fromBlock.mediantime;
  }

  get energyDiff(): number {
    return ((this.span * 600 - this.timeDiff) / (this.span * 600)) * 100;
  }

  get totalIconCount() {
    return Math.round(Math.abs(this.energyDiff / 5));
  }

  get iconArray() {
    const count = this.totalIconCount > this.maxCount ? this.maxCount : this.totalIconCount;
    return new Array(count).fill(1);
  }

  constructor(
    private route: ActivatedRoute,
    public stateService: StateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

}
