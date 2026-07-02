import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AsistenteAnalista } from './asistente-analista';

describe('AsistenteAnalista', () => {
  let component: AsistenteAnalista;
  let fixture: ComponentFixture<AsistenteAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenteAnalista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenteAnalista);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
