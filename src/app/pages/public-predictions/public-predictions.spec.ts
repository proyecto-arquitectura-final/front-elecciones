import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PublicPredictions } from './public-predictions';

describe('PublicPredictions', () => {
  let fixture: ComponentFixture<PublicPredictions>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicPredictions],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PublicPredictions);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders prediction values returned by the public endpoint', async () => {
    fixture.detectChanges();
    http.expectOne('/api/v1/public/predictions').flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:00:00Z',
      data: {
        election: { id: 1, name: 'Elección persistida', type: 'PRESIDENCIA', round: 'PRIMERA', date: '2026-05-31', state: 'EN_CONTEO' },
        elections: [{ id: 1, name: 'Elección persistida', type: 'PRESIDENCIA', round: 'PRIMERA', date: '2026-05-31', state: 'EN_CONTEO' }],
        metrics: {
          processedPercentage: 64.5,
          confidence: 82.4,
          averageUncertainty: 2.6,
          pollCount: 3,
          totalSample: 5200,
          modelMode: 'RESULTADOS_Y_ENCUESTAS',
          dataQuality: 'ALTA',
          officialWeight: 80,
          pollWeight: 20,
        },
        candidates: [{
          rank: 1, id: 10, candidate: 'Candidata BD', party: 'Partido BD', acronym: 'PBD', color: '#123456',
          votes: 1200, currentPercentage: 45.3, pollAverage: 43.8, projectedPercentage: 45,
          probability: 77.2, uncertaintyMargin: 2.1, trend: -0.3, pollObservations: 3,
        }],
        polls: [{ id: 7, source: 'Encuestadora BD', date: '2026-05-20', sampleSize: 2000, marginError: 2.2, methodology: 'Mixta' }],
        factors: [{ code: 'COBERTURA', title: 'Cobertura', value: '64.5%', description: 'Dato persistido', quality: 'ALTA' }],
        generatedAt: '2026-07-02T00:00:00Z',
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Candidata BD');
    expect(text).toContain('77.2%');
    expect(text).toContain('Elección persistida');

    expect(fixture.componentInstance.data.polls[0].source).toBe('Encuestadora BD');

    const currentBar = fixture.nativeElement.querySelector('.bar--current') as HTMLElement;
    const projectedBar = fixture.nativeElement.querySelector('.bar--projected') as HTMLElement;

    expect(currentBar).toBeTruthy();
    expect(projectedBar).toBeTruthy();
    expect(projectedBar.style.background).toBe('');
    expect(projectedBar.getAttribute('aria-label')).toContain('Proyección final de Candidata BD');
  });
});
