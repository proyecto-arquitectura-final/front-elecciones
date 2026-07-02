import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ResultadosAnalista } from './resultados-analista';

describe('ResultadosAnalista', () => {
  let component: ResultadosAnalista;
  let fixture: ComponentFixture<ResultadosAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadosAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultadosAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
