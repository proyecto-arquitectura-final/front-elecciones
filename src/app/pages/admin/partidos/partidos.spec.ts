import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Partidos } from './partidos';

describe('Partidos', () => {
  let component: Partidos;
  let fixture: ComponentFixture<Partidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Partidos],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Partidos);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
