import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Auditoria } from './auditoria';

describe('Auditoria', () => {
  let component: Auditoria;
  let fixture: ComponentFixture<Auditoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auditoria],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Auditoria);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
