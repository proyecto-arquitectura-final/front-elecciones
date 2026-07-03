import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta gestión paginada', () => {
    service.gestion('ana', 1, 10).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/usuarios/gestion'));
    expect(request.request.params.get('search')).toBe('ana');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ success: true, message: 'OK', data: {}, timestamp: '' });
  });
  it('crea usuario sin exponer entidad JPA', () => {
    const body = { name: 'Ana', email: 'ana@test.co', password: '12345678', role: 'ANALISTA' as const, active: true };
    service.crear(body).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/usuarios'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ success: true, message: 'OK', data: {}, timestamp: '' });
  });
});
