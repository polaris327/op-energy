import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartV2Component } from './start-v2.component';

describe('StartV2Component', () => {
  let component: StartV2Component;
  let fixture: ComponentFixture<StartV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
