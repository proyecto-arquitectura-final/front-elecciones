import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReporteService } from './reporte.service';

describe('ReporteService', () => {
  let service: ReporteService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReporteService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta resumen por elección', () => {
    service.gestion(7).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/reportes/gestion'));
    expect(request.request.params.get('electionId')).toBe('7');
    request.flush({ success: true, message: 'OK', data: {}, timestamp: '' });
  });
  it('solicita descarga binaria por elección y formato', () => {
    service.descargarResultadosPorEleccion(7, 'CSV').subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/reportes/resultados'));
    expect(request.request.responseType).toBe('blob');
    expect(request.request.params.get('format')).toBe('csv');
    request.flush(new Blob(['a,b']));
  });
});
