import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Block } from '../../../interfaces/electrs.interface';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';

export const MAX_COUNT = 14;
@Component({
  selector: 'app-blockspan',
  templateUrl: './blockspan.component.html',
  styleUrls: ['./blockspan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockspanComponent implements OnInit, OnDestroy {
  @Input() fromBlock: Block;
  @Input() toBlock: Block;

  get span(): number {
    return (this.toBlock.height - this.fromBlock.height);
  }

  get fromDetailLink() {
    return this.relativeUrlPipe.transform(`/hashstrikes/block/${this.fromBlock.height}`);
  }

  get toDetailLink() {
    return this.relativeUrlPipe.transform(`/hashstrikes/block/${this.toBlock.height}`);
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
}
