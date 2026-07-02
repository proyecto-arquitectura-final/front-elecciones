import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAnalista } from './dashboard-analista';

describe('DashboardAnalista', () => {
  let component: DashboardAnalista;
  let fixture: ComponentFixture<DashboardAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
