import { Component, Output, Input, Inject, LOCALE_ID, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { OnChanges, EventEmitter } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { formatterXAxis, formatterXAxisLabel } from 'src/app/shared/graphs.utils';

@Component({
  selector: 'app-candlestick-chart',
  templateUrl: './candlestick-chart.component.html',
  styles: [`
    .loadingGraphs {
      position: absolute;
      top: 50%;
      left: calc(50% - 16px);
      z-index: 100;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandlestickChartComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() theme: string;
  @Input() height: number | string = '200';
  @Input() right: number | string = '20';
  @Input() top: number | string = '20';
  @Input() left: number | string = '0';
  @Input() template: ('widget' | 'advanced') = 'widget';
  @Input() windowPreferenceOverride: string;
  @Output() onDataZoom: EventEmitter<unknown>; // callback, that can be used on slider change
  @Output() onInit: EventEmitter<unknown>; // callback, that can be used on chart init

  isLoading = true;
  chartOption: EChartsOption = {};
  private echartsInstance: any; // contains pointer to current echarts instance gathered from onChartInit event
  chartInitOption = {
    renderer: 'svg'
  };
  windowPreference: string;

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private storageService: StorageService,
  ) {
    this.onInit = new EventEmitter();
    this.onDataZoom = new EventEmitter();
  }

  ngOnInit() {
    this.isLoading = true;
  }

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    this.windowPreference = this.windowPreferenceOverride ? this.windowPreferenceOverride : this.storageService.getValue('graphWindowPreference');
    this.mountChart();
  }

  rendered() {
    if (!this.data) {
      return;
    }
    this.isLoading = false;
  }
  onChartInit( ec) {
    this.echartsInstance = ec;
    if( this.onInit !== null) {
      this.onInit.emit( ec);
    }
  }
  onChartDataZoom( event) {
    if( this.onDataZoom !== null) {
      this.onDataZoom.emit( event);
    }
  }

  mountChart(): void {
    this.chartOption = {
      xAxis: {
        data: ['2022-03-24', '2022-03-25', '2022-03-26', '2022-03-27', '2022-03-28', '2022-03-29', '2022-03-30', '2022-03-31']
      },
      yAxis: {},
      series: [
        {
          type: 'candlestick',
          data: [
            [20, 34, 10, 38],
            [40, 35, 30, 50],
            [31, 38, 33, 44],
            [38, 15, 5, 42],
            [31, 38, 33, 44],
            [20, 34, 10, 38],
            [31, 38, 33, 44],
            [40, 35, 30, 50],
          ]
        }
      ]
    };
  }

  isMobile() {
    return window.innerWidth <= 767.98;
  }
}
