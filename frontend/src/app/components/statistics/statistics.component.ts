import { Component, OnInit, LOCALE_ID, Inject, OnDestroy } from '@angular/core';
import { Subscription} from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { Block } from '../../interfaces/electrs.interface';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, OnDestroy {

  lastDifficultyEpochEndBlocks: Block[];
  lastDifficultyEpochEndBlocksSubscription: Subscription;
  lastDifficultyEpochEndBlocksSeries: any;
  difficultySliderStartValue: number = 0; // those 2 variables contain start / end values for difficulty chart slider
  difficultySliderEndValue: number = 0;

  constructor(
    private stateService: StateService,
  ) { }

  ngOnDestroy() {
    this.lastDifficultyEpochEndBlocksSubscription.unsubscribe();
  }

  ngOnInit() {
    this.lastDifficultyEpochEndBlocks = [];
    this.lastDifficultyEpochEndBlocksSubscription = this.stateService.lastDifficultyEpochEndBlocks$
      .subscribe(([block, txConfirmed]) => {
        this.lastDifficultyEpochEndBlocks.push( block);
        if( this.lastDifficultyEpochEndBlocks.length > 0){
          if(this.lastDifficultyEpochEndBlocks.length <= 30) {
            this.difficultySliderStartValue = this.lastDifficultyEpochEndBlocks[0].height;
            this.difficultySliderEndValue = this.lastDifficultyEpochEndBlocks[ this.lastDifficultyEpochEndBlocks.length - 1].height;
          }else{
            this.difficultySliderStartValue = this.lastDifficultyEpochEndBlocks[ this.lastDifficultyEpochEndBlocks.length - 30].height;
            this.difficultySliderEndValue = this.lastDifficultyEpochEndBlocks[ this.lastDifficultyEpochEndBlocks.length - 1].height;
          }
        }
        let map = new Map<number, string>();
        this.lastDifficultyEpochEndBlocks.map((block) => {
          const block_date = new Date( block.timestamp * 1000);
          const month_real = block_date.getMonth() + 1;
          const month = (month_real < 10) ? '0' + String(month_real) : month_real;
          const day = (block_date.getDate() < 10) ? '0' + String(block_date.getDate()) : block_date.getDate();
          map.set( block.height, String(block.height) + '\n'
            + block_date.getFullYear() + '/' + month + '/' + day);
        });
        this.lastDifficultyEpochEndBlocksSeries = {
          labels: map,
          series: [this.lastDifficultyEpochEndBlocks.map((block)=> [ block.height, block.difficulty])]
        };
      });
  }
}
