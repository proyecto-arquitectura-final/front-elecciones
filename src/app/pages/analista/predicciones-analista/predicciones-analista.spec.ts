import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PrediccionesAnalista } from './predicciones-analista';

describe('PrediccionesAnalista', () => {
  let component: PrediccionesAnalista;
  let fixture: ComponentFixture<PrediccionesAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrediccionesAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PrediccionesAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
