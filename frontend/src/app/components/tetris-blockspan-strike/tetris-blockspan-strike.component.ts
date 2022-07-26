import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';
import { TimeStrike } from 'src/app/interfaces/op-energy.interface';

export const MAX_COUNT = 12;
@Component({
  selector: 'app-tetris-blockspan-strike',
  templateUrl: './tetris-blockspan-strike.component.html',
  styleUrls: ['./tetris-blockspan-strike.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisBlockspanStrikeComponent implements OnInit, OnDestroy {
  @Input() fromBlock: number;
  @Input() toBlock: number;
  @Input() elapsedTime: number;
  @Input() strike: TimeStrike;
  maxCount = MAX_COUNT;
  flameIconArray = new Array(MAX_COUNT).fill(1);

  get span(): number {
    return (this.toBlock - this.fromBlock);
  }

  get energyDiff(): number {
    return ((this.span * 600 - this.elapsedTime) / (this.span * 600)) * 100;
  }

  get totalIconCount() {
    let count = Math.round((6 + this.energyDiff / 5) / 2);
    if (count < 0) {
      count = 0;
    }
    return count;
  }

  get iconArray() {
    const count = this.totalIconCount > this.maxCount ? this.maxCount : this.totalIconCount;
    return count ? new Array(count).fill(1) : [];
  }

  constructor(
    private route: ActivatedRoute,
    private relativeUrlPipe: RelativeUrlPipe,
    public stateService: StateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  blockspanDetailLink() {
    return this.relativeUrlPipe.transform(`/tetris/blockspan/${this.fromBlock}/${this.toBlock}`);
  }

  strikeDetailLink() {
    return this.relativeUrlPipe.transform(`/tetris/strike/${this.fromBlock}/${this.toBlock}/${this.strike.blockHeight}/${this.strike.nLockTime}/${this.strike.creationTime}`);
  }

}
