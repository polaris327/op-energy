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
    return this.relativeUrlPipe.transform('/tetris/blockspans/1');
  }

  blockspanDetailLink() {
    return this.relativeUrlPipe.transform('/tetris/blockspan/89778/89791');
  }

  pastStrikeDetailLink() {
    return this.relativeUrlPipe.transform('/tetris/strike/89778/89791/89791/1652239330/1656641994');
  }

  futureStrikeDetailLink() {
    return this.relativeUrlPipe.transform('/tetris/strike/89778/120000/120000/1652239330/1656641994');
  }
}
