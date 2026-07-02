import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Encuestas } from './encuestas';

describe('Encuestas', () => {
  let component: Encuestas;
  let fixture: ComponentFixture<Encuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Encuestas],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Encuestas);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
