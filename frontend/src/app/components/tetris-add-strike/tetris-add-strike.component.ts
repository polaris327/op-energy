import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';

export const MAX_COUNT = 8;
@Component({
  selector: 'app-tetris-add-strike',
  templateUrl: './tetris-add-strike.component.html',
  styleUrls: ['./tetris-add-strike.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisAddStrikeComponent implements OnInit, OnDestroy {
  @Input() fromBlock: number;
  @Input() span: number = 1;
  @Input() strike: number = 600;
  @Output() emitAdd = new EventEmitter();

  get toBlock() {
    return +this.fromBlock + +this.span;
  }

  constructor(
    private route: ActivatedRoute,
    public stateService: StateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  addStrike() {
    const strike = {
      blockHeight: this.toBlock,
      elapsedTime: this.strike
    }
    this.emitAdd.emit(strike);
  }

  spanChange() {
    this.strike = 600 * this.span;
  }
}
