import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PartidosAnalista } from './partidos-analista';

describe('PartidosAnalista', () => {
  let component: PartidosAnalista;
  let fixture: ComponentFixture<PartidosAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartidosAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PartidosAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
