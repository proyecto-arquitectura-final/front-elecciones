import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { EncuestasAnalista } from './encuestas-analista';

describe('EncuestasAnalista', () => {
  let component: EncuestasAnalista;
  let fixture: ComponentFixture<EncuestasAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestasAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuestasAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
