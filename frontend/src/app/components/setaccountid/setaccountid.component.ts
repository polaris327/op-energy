import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-setaccountid',
  templateUrl: './setaccountid.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetAccountIdComponent implements OnInit {

  accountIdSubscription: Subscription;

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
        const maybeAccountId = params.get('accountid');
        if( maybeAccountId !== null) {
          const accountId = maybeAccountId.slice(0, 64); // limit user's input to 64 bytes
          this.accountIdSubscription = this.stateService.$accountId.subscribe( newAccountId => {
            this.cd.detectChanges();
            this.router.navigate( [ '/' ], {});
            this.accountIdSubscription.unsubscribe();
          });
          this.websocketService.checkAccountId( accountId);
        }
      });
  }

}
