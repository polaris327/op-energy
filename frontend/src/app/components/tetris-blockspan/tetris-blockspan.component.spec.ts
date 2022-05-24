import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TetrisBlockspanComponent } from './tetris-blockspan.component';

describe('TetrisBlockspanComponent', () => {
  let component: TetrisBlockspanComponent;
  let fixture: ComponentFixture<TetrisBlockspanComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TetrisBlockspanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TetrisBlockspanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
