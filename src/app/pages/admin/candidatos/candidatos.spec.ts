import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Candidatos } from './candidatos';

describe('Candidatos', () => {
  let component: Candidatos;
  let fixture: ComponentFixture<Candidatos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Candidatos],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Candidatos);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
