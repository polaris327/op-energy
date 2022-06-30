import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TetrisBlockspanStrikeComponent } from './tetris-blockspan-strike.component';

describe('TetrisBlockspanStrikeComponent', () => {
  let component: TetrisBlockspanStrikeComponent;
  let fixture: ComponentFixture<TetrisBlockspanStrikeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TetrisBlockspanStrikeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TetrisBlockspanStrikeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
