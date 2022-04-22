import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { Block } from '../../interfaces/electrs.interface';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-tenmin-bet',
  templateUrl: './tenmin-bet.component.html',
  styleUrls: ['./tenmin-bet.component.scss']
})
export class TenminBetComponent implements OnInit, OnDestroy {
  @Input() blockStyle: any;
  @Input() medianTimeDiff: number;
  @Input() blockNumber: number;
  @Input() nlockTime: number;

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
