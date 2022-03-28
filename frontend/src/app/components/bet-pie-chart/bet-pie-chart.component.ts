import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { EChartOption } from 'echarts/lib/echarts';

@Component({
	selector: 'remi-bet-pie-chart',
	templateUrl: './bet-pie-chart.component.html',
	styleUrls: ['./bet-pie-chart.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BetPieChartComponent implements OnInit, OnChanges {
	
	@Input() data: any;
	@Input() overrideOptions?: EChartOption = {};
	
	chartOptions;
	
	constructor() { }
	
	ngOnInit() {
	}

	ngOnChanges() {
		if (this.data) {
			this.chartOptions = this.getOptions();
		}
	}
	
	getOptions() {
		
		const options = {
			textStyle: {
				color: '#acacac',
				fontFamily: '"D-Din", Helvetica, sans-serif',
				fontSize: 16
			},
			tooltip: {
				trigger: 'item',
				formatter: '{b} : {c} satoshis - {d}%'
			},
			// legend: {
			// 	orient: 'vertical',
			// 	top: 'middle',
			// 	bottom: 10,
			// 	right: 0,
			// 	data: ['fast', 'slow'],
			// 	textStyle: {
			// 		color: '#C7C7C7',
			// 		fontFamily: '"D-Din", Helvetica, sans-serif',
			// 		fontSize: 16
			// 	},
			// 	formatter: (name) => {
			// 		return this.getLegendLabel(name);
			// 	}
			// 	// formatter: `I am {name} \n${this.data[name]['count']} products`
			// },
			series: [
				{
					type: 'pie',
					radius: '87%',
					center: ['50%', '50%'],
					selectedMode: 'single',
					data: this.prepareChartData(),
					itemStyle: {
						emphasis: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.5)'
						}
					},
					label: {
						normal: {
							fontSize: 14,
							color: '#fff',
							formatter: '{c} satoshi, 17 users, 29 bets',
							// position: 'inside'
						}
					},
				}
			]
		};
		
		Object.assign(options, this.overrideOptions);
		
		return options;
		
	}
	
	private getLegendLabel(name) {
		const count = this.data.find(item => item.position === name).count;
		return `\n  I am ${name} \n\n  ${count.toLocaleString()} sat`;
	}

	private prepareChartData() {
		return this.data.map(item => ({
			value: Math.round(item.value),
			name: item.name,
			itemStyle: {color: item.name === 'Total Bet Slow' ? '#dc3545' : '#1a9436'}
		}));
	}
}
