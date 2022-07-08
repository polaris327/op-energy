import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';

export const MAX_COUNT = 8;
@Component({
  selector: 'app-tetris-blockspan-navigator',
  templateUrl: './tetris-blockspan-navigator.component.html',
  styleUrls: ['./tetris-blockspan-navigator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisBlockspanNavigatorComponent implements OnInit, OnDestroy {
  @Input() fromBlock: number;
  @Input() span: number = 2;
  @Output() emitGo = new EventEmitter();

  get toBlock() {
    return +this.fromBlock + +this.span - 1;
  }

  constructor(
    private route: ActivatedRoute,
    public stateService: StateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  onGo() {
    this.emitGo.emit({
      tipBlock: this.toBlock,
      span: +this.span - 1
    });
  }
}
