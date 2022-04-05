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
  @Input() startValue: number;
  @Input() endValue: number;
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
    let xValues = [];
    this.data.labels.forEach(v => xValues.push(v));
    xValues = xValues.map((v, idx) => {
      const valueRange = xValues[idx + 3] ? `${(+xValues[idx].split('\n')[0]).toLocaleString()} - ${(+xValues[idx + 3].split('\n')[0]).toLocaleString()}` : `${xValues[idx].split('\n')[0]}`;
      const dateRange = xValues[idx + 3] ? `${xValues[idx].split('\n')[1]} - ${xValues[idx + 3].split('\n')[1]}` : `${xValues[idx].split('\n')[1]}`;
      return `${valueRange}\n${dateRange}`
    });
    const sValues = this.data.series[0].map(d => d[1]);
    const series = sValues.map((d, idx) => {
      const open = sValues[idx];
      const close = sValues[idx + 3];
      const lowest = Math.min(sValues[idx], sValues[idx + 1], sValues[idx + 2], sValues[idx + 3]);
      const highest = Math.max(sValues[idx], sValues[idx + 1], sValues[idx + 2], sValues[idx + 3]);
      return [open, close, lowest, highest];
    });
    this.chartOption = {
      toolbox: {
        feature: {
          restore: {},
        },
      },
      grid: {
        height: this.height,
        right: this.right,
        top: this.top,
        left: this.left,
        containLabel: true,
      },
      animation: false,
      xAxis: [
        {
          type: 'category',
          data: xValues,
        }
      ],
      yAxis: {
        type: 'value',
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: {
          fontSize: 11,
          formatter: (value: string, index: number) => {
            return String( (Number(value)).toExponential(1));
          }
        },
        splitLine: {
          lineStyle: {
            type: 'dotted',
            color: '#ffffff66',
            opacity: 0.25,
          }
        }
      },
      dataZoom: [
        {
          showDetail: false,
          show: true,
          type: 'slider',
          xAxisIndex: 0,
          brushSelect: false,
          realtime: true,
          bottom: 0,
          start: (this.startValue / this.endValue) * 100,
          end: 100,
          selectedDataBackground: {
            lineStyle: {
              color: '#fff',
              opacity: 0.45,
            },
            areaStyle: {
              opacity: 0,
            }
          },
        },
        {
          type: 'inside',
          realtime: true,
          zoomLock: false,
          zoomOnMouseWheel: (this.template === 'advanced') ? true : false,
          moveOnMouseMove: (this.template === 'widget') ? true : false,
          maxSpan: 100,
          minSpan: 10,
        }
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        textStyle: {
          color: '#000'
        },
        formatter: function (param: any) {
          param = param[0];
          return [
            '' + param.name.split('\n').join('<br/>') + '<hr size=1 style="margin: 3px 0">',
            'O: ' + String( (Number(param.data[1])).toExponential(3)) + '<br/>',
            'H: ' + String( (Number(param.data[4])).toExponential(3)) + '<br/>',
            'L: ' + String( (Number(param.data[3])).toExponential(3)) + '<br/>',
            'C: ' + String( (Number(param.data[2])).toExponential(3)) + '<br/>',
          ].join('');
        }
        // extraCssText: 'width: 170px'
      },
      series: [
        {
          name: 'OHLC',
          type: 'candlestick',
          data: series
        }
      ]
    };
  }

  isMobile() {
    return window.innerWidth <= 767.98;
  }
}
