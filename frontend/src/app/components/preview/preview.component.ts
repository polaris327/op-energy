import { ChangeDetectionStrategy, Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnInit {

  constructor(
    private router: Router,
    private relativeUrlPipe: RelativeUrlPipe,
  ) { }

  ngOnInit() {

  }

  blockspansLink() {
    return this.relativeUrlPipe.transform('/hashstrikes/blockspans/1');
  }

  pastStrikeDetailLink() {
    return this.relativeUrlPipe.transform('/hashstrikes/strike_detail/89778/89791/89791/1652239330/1656641994');
  }

  futureStrikeDetailLink() {
    return this.relativeUrlPipe.transform('/hashstrikes/strike_detail/89778/120000/120000/1652239330/1656641994');
  }

  pastEnergySummaryLink() {
    return this.relativeUrlPipe.transform('/hashstrikes/energy_summary/89778/89791');
  }

  futureEnergySummaryLink() {
    return this.relativeUrlPipe.transform('/hashstrikes/energy_summary/89778/120000');
  }

  pastEnergyDetailLink() {
    return this.relativeUrlPipe.transform('/hashstrikes/energy_detail/89778/89791');
  }
}
