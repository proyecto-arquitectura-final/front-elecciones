import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardAnalista } from './dashboard-analista';

describe('DashboardAnalista', () => {
  let component: DashboardAnalista;
  let fixture: ComponentFixture<DashboardAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
