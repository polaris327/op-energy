import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-setaccountsecret',
  templateUrl: './setaccountsecret.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetAccountSecretComponent implements OnInit {

  accountTokenSubscription: Subscription;

  constructor(
    public stateService: StateService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private websocketService: WebsocketService,
  ) { }

  ngOnInit() {
    this.route.paramMap
      .subscribe( (params: ParamMap) => {
        const maybeAccountSecret = params.get('accountsecret');
        if( maybeAccountSecret !== null) {
          const accountSecret = maybeAccountSecret.slice(0, 64); // limit user's input to 64 bytes
          this.accountTokenSubscription = this.stateService.$accountToken.subscribe( newAccountToken => {
            this.cd.detectChanges();
            this.router.navigate( [ '/' ], {});
            this.accountTokenSubscription.unsubscribe();
          });
          this.websocketService.checkAccountSecret( accountSecret);
        }
      });
  }

}
