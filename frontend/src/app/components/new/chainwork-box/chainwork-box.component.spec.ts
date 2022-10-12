import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChainworkBoxComponent } from './chainwork-box.component';

describe('ChainworkBoxComponent', () => {
  let component: ChainworkBoxComponent;
  let fixture: ComponentFixture<ChainworkBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChainworkBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChainworkBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
