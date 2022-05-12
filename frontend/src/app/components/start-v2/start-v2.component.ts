import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { StateService } from 'src/app/services/state.service';
import { specialBlocks } from 'src/app/app.constants';

@Component({
  selector: 'app-start-v2',
  templateUrl: './start-v2.component.html',
  styleUrls: ['./start-v2.component.scss'],
})
export class StartV2Component implements OnInit {
  interval = 60;
  colors = ['#5E35B1', '#ffffff'];

  countdown = 0;
  specialEvent = false;
  eventName = '';

  constructor(
    private websocketService: WebsocketService,
    private stateService: StateService,
  ) { }

  ngOnInit() {
    this.websocketService.want(['blocks', 'stats', 'mempool-blocks']);
    this.stateService.blocks$
      .subscribe((blocks: any) => {
        if (this.stateService.network !== '') {
          return;
        }
        this.countdown = 0;
        const block = blocks[0];

        for (const sb in specialBlocks) {
          const height = parseInt(sb, 10);
          const diff = height - block.height;
          if (diff > 0 && diff <= 1008) {
            this.countdown = diff;
            this.eventName = specialBlocks[sb].labelEvent;
          }
        }
        if (specialBlocks[block.height]) {
          this.specialEvent = true;
          this.eventName = specialBlocks[block.height].labelEventCompleted;
          setTimeout(() => {
            this.specialEvent = false;
          }, 60 * 60 * 1000);
        }
      });
  }
}
