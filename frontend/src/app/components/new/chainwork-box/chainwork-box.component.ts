import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';

export const MAX_COUNT = 14;
@Component({
  selector: 'app-chainwork-box',
  templateUrl: './chainwork-box.component.html',
  styleUrls: ['./chainwork-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChainworkBoxComponent implements OnInit, OnDestroy {
  @Input() type: 'Energy' | 'Strike' | 'Strike_Boiling' = 'Energy';
  @Input() color = 'red';
  @Input() totalIconCount: number;
  @Input() fromChainwork: any;
  @Input() toChainwork: any;
  @Input() isUnknown: boolean;
  @Input() isDetailed: boolean;
  @Input() link: string;
  maxCount = MAX_COUNT;

  get iconArray() {
    const count = this.totalIconCount > this.maxCount ? this.maxCount : this.totalIconCount;
    return count ? new Array(count).fill(1) : [];
  }

  get icon() {
    return this.type === 'Energy' ? 'fire' : this.type === 'Strike' ? 'tint' : 'cloud';
  }

  get chainworkDiff(): bigint {
    if (!this.fromChainwork || !this.toChainwork) {
      return BigInt(0);
    }
    return BigInt(this.getHexValue(this.toChainwork)) - BigInt(this.getHexValue(this.fromChainwork));
  }

  get fromInDecimal() {
    return parseInt(this.getHexValue(this.fromChainwork), 16);
  }

  get toInDecimal() {
    return parseInt(this.getHexValue(this.toChainwork), 16);
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

  getHexValue(str) {
    const arr1 = str.split('');
    const idx = arr1.findIndex(a => a !== '0');
    let hexValue = '0x';
    if (idx > -1) {
      hexValue += str.slice(idx);
    } else {
      hexValue += str;
    }
    return hexValue;
  }
}
