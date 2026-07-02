import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { EstadisticasAnalista } from './estadisticas-analista';

describe('EstadisticasAnalista', () => {
  let component: EstadisticasAnalista;
  let fixture: ComponentFixture<EstadisticasAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticasAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
