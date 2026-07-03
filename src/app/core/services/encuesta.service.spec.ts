import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PollManagement } from '../models/poll.model';
import { EncuestaService } from './encuesta.service';

const management: PollManagement = {
  counters: { total: 0, approved: 0, pending: 0, rejected: 0, averageSample: 0 },
  polls: { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
  elections: [],
  candidates: [],
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('EncuestaService', () => {
  let service: EncuestaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EncuestaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests management data with filters and pagination', () => {
    service
      .gestion({ electionId: 3, status: 'APROBADA', search: 'firma', page: 2, size: 20 })
      .subscribe((response) => expect(response).toEqual(management));

    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiUrl}/encuestas/gestion`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('electionId')).toBe('3');
    expect(request.request.params.get('status')).toBe('APROBADA');
    expect(request.request.params.get('search')).toBe('firma');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('20');
    request.flush({ success: true, message: 'OK', data: management });
  });

  it('uploads CSV using multipart form data', () => {
    const file = new File(['header\n'], 'encuestas.csv', { type: 'text/csv' });

    service.importarCsv(file).subscribe((response) => {
      expect(response).toEqual({ polls: 1, results: 4 });
    });

    const request = http.expectOne(`${environment.apiUrl}/encuestas/import-csv`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    const uploaded = (request.request.body as FormData).get('file') as File;
    expect(uploaded.name).toBe('encuestas.csv');
    expect(uploaded.type).toBe('text/csv');
    request.flush({ success: true, message: 'OK', data: { polls: 1, results: 4 } });
  });
});
