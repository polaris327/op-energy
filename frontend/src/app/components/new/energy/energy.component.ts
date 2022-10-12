import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';
import { Block } from '../../../interfaces/electrs.interface';

@Component({
  selector: 'app-energy',
  templateUrl: './energy.component.html',
  styleUrls: ['./energy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnergyComponent implements OnInit, OnDestroy {
  @Input() fromBlock: Block;
  @Input() toBlock: Block;
  @Input() isDetailed: boolean;

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
    let count = Math.round((6 + this.energyDiff / 5) / 2);
    if (count < 0) {
      count = 0;
    }
    return count;
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

  energyDetailLink() {
    return this.relativeUrlPipe.transform(`/hashstrikes/energy_detail/${this.fromBlock.height}/${this.toBlock.height}`);
  }
}
