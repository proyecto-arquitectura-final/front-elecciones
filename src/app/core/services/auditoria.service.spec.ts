import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuditoriaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envía filtros y paginación al endpoint de gestión', () => {
    service.gestion({ search: 'admin', success: false, page: 2, size: 20 }).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/auditoria/gestion'));
    expect(request.request.params.get('search')).toBe('admin');
    expect(request.request.params.get('success')).toBe('false');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ success: true, message: 'OK', data: {}, timestamp: '' });
  });
});
