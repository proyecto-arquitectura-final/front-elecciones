import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Reportes } from './reportes';

describe('Reportes', () => {
  let component: Reportes;
  let fixture: ComponentFixture<Reportes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reportes],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reportes);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
