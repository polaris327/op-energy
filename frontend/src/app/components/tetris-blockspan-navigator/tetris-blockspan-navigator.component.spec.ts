import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TetrisBlockspanNavigatorComponent } from './tetris-blockspan-navigator.component';

describe('TetrisBlockspanNavigatorComponent', () => {
  let component: TetrisBlockspanNavigatorComponent;
  let fixture: ComponentFixture<TetrisBlockspanNavigatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TetrisBlockspanNavigatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TetrisBlockspanNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
