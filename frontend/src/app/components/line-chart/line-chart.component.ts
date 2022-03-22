import { Component, Output, Input, Inject, LOCALE_ID, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { OnChanges, EventEmitter } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { formatterXAxis, formatterXAxisLabel } from 'src/app/shared/graphs.utils';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
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
export class LineChartComponent implements OnInit, OnChanges {
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
  lineChartOption: EChartsOption = {};
  private echartsInstance: any; // contains pointer to current echarts instance gathered from onChartInit event
  lineChartInitOption = {
    renderer: 'svg'
  };
  windowPreference: string;

  isLogMode: boolean;

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
    this.lineChartOption = {
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
      dataZoom: [{
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
      },
      ],
      tooltip: {
        show: true,
        trigger: 'axis',
        position: (pos, params, el, elRect, size) => {
          const obj = { top: -20 };
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 80;
          return obj;
        },
        extraCssText: `width: 260px;
                      background: transparent;
                      border: none;
                      box-shadow: none;`,
        axisPointer: {
          type: 'line',
        },
        formatter: (params: any) => {
          let axisValueLabel: string = params[0].axisValue;
          const map_value = this.data.labels.get(Number( axisValueLabel));

          if ( map_value !== undefined) {
            axisValueLabel = map_value;
          }

          const colorSpan = (color: string) => `<span class="indicator" style="background-color: ` + color + `"></span>`;
          let itemFormatted = '<div class="title">' + axisValueLabel + '</div>';
          params.map((item: any, index: number) => {
            if (index < 26) {
              itemFormatted += `<div class="item">
                <div class="indicator-container">${colorSpan(item.color)}</div>
                <div class="grow"></div>
                <div class="value">${String( (Number(item.value[1])).toExponential(7))}</div>
              </div>`;
            }
          });
          return `<div class="tx-wrapper-tooltip-chart ${(this.template === 'advanced') ? 'tx-wrapper-tooltip-chart-advanced' : ''}">${itemFormatted}</div>`;
        }
      },
      xAxis: [
        {
          nameLocation: 'middle',
          nameTextStyle: {
            padding: [20, 0, 0, 0],
          },
          type: 'category',
          min: 'dataMin',
          max: 'dataMax',
          interval: 4032,
          axisLabel: {
            margin: 20,
            align: 'center',
            fontSize: 11,
            lineHeight: 12,
            hideOverlap: true,
            padding: [0, 5],
            formatter: (value: string, index: number) => {
              const map_value = this.data.labels.get(Number( value));
              if ( map_value !== undefined) {
                return map_value;
              } else { // do not show values in case of missing from map
                return null;
              }
            },
          },
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
      series: [
        {
          data: this.data.series[0],
          type: 'line',
          smooth: false,
          showSymbol: false,
          lineStyle: {
            width: 3,
          },
        },
      ],
    };
  }

  toggleViewMode() {
    this.isLogMode = !this.isLogMode;
    this.lineChartOption = {
      ...this.lineChartOption,
      yAxis: {
        ...this.lineChartOption.yAxis,
        type: this.isLogMode ? 'log' : 'value',
        min: this.isLogMode ? null : 'dataMin',
        max: this.isLogMode ? null : 'dataMax'
      }
    }
  }

  isMobile() {
    return window.innerWidth <= 767.98;
  }
}
