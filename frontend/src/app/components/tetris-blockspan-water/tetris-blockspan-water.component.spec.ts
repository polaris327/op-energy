import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TetrisBlockspanWaterComponent } from './tetris-blockspan-water.component';

describe('TetrisBlockspanWaterComponent', () => {
  let component: TetrisBlockspanWaterComponent;
  let fixture: ComponentFixture<TetrisBlockspanWaterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TetrisBlockspanWaterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TetrisBlockspanWaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
