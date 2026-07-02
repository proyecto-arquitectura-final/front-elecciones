import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Resultados } from './resultados';

describe('Resultados', () => {
  let component: Resultados;
  let fixture: ComponentFixture<Resultados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resultados],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Resultados);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
