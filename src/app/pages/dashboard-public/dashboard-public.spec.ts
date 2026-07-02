import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardPublic } from './dashboard-public';

describe('DashboardPublic', () => {
  let component: DashboardPublic;
  let fixture: ComponentFixture<DashboardPublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPublic],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPublic);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
