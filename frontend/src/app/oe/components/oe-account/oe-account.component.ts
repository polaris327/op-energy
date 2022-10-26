import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { OeStateService } from 'src/app/oe/services/state.service';
import { RelativeUrlPipe } from 'src/app/shared/pipes/relative-url/relative-url.pipe';

@Component({
  selector: 'app-oe-account',
  templateUrl: './oe-account.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OeAccountComponent implements OnInit {

  accountTokenSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private relativeUrlPipe: RelativeUrlPipe,
    private opEnergyStateService: OeStateService,
    private websocketService: WebsocketService,
  ) { }

  ngOnInit() {
    this.route.paramMap
      .subscribe( (params: ParamMap) => {
        const maybeAccountSecret = params.get('accountsecret');
        if( maybeAccountSecret !== null) {
          const accountSecret = maybeAccountSecret.slice(0, 64); // limit user's input to 64 bytes
          this.accountTokenSubscription = this.opEnergyStateService.$accountToken.subscribe( newAccountToken => {
            this.cd.detectChanges();
            this.router.navigate( [ this.relativeUrlPipe.transform('/preview-page') ], {});
            this.accountTokenSubscription.unsubscribe();
          });
          this.websocketService.customMessage( { action: 'checkAccountSecret', data: [ accountSecret] });
        }
      });
  }

}
