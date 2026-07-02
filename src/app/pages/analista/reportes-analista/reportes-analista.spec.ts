import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReportesAnalista } from './reportes-analista';

describe('ReportesAnalista', () => {
  let component: ReportesAnalista;
  let fixture: ComponentFixture<ReportesAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
