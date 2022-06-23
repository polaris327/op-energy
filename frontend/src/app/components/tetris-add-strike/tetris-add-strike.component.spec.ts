import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TetrisAddStrikeComponent } from './tetris-add-strike.component';

describe('TetrisAddStrikeComponent', () => {
  let component: TetrisAddStrikeComponent;
  let fixture: ComponentFixture<TetrisAddStrikeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TetrisAddStrikeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TetrisAddStrikeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
