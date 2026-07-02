import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CandidatosAnalista } from './candidatos-analista';

describe('CandidatosAnalista', () => {
  let component: CandidatosAnalista;
  let fixture: ComponentFixture<CandidatosAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatosAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidatosAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
