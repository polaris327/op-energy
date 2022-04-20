import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { Block } from '../../interfaces/electrs.interface';
import { StateService } from '../../services/state.service';

interface PastBlock extends Block {
  mediantimeDiff: number;
}

@Component({
  selector: 'app-tenmin-block',
  templateUrl: './tenmin-block.component.html',
  styleUrls: ['./tenmin-block.component.scss']
})
export class TenminBlockComponent implements OnInit, OnDestroy {
  @Input() pastBlock: PastBlock;
  @Input() blockStyle: any;
  @Input() top: number;
 
  constructor(
    public stateService: StateService,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
