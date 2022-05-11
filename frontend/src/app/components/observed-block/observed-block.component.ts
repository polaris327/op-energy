import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { Block } from '../../interfaces/electrs.interface';
import { StateService } from '../../services/state.service';

interface PastBlock extends Block {
  mediantimeDiff: number;
}

@Component({
  selector: 'app-observed-block',
  templateUrl: './observed-block.component.html',
  styleUrls: ['./observed-block.component.scss']
})
export class ObservedBlockComponent implements OnInit, OnDestroy {
  @Input() pastBlock: PastBlock;
  @Input() blockStyle: any;
 
  constructor(
    public stateService: StateService,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
