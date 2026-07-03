import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PublicAssistant } from './public-assistant';

describe('PublicAssistant', () => {
  let fixture: ComponentFixture<PublicAssistant>;
  let component: PublicAssistant;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PublicAssistant],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PublicAssistant);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    http.verify();
  });

  it('loads elections and renders a friendly answer without exposing technical provider details', async () => {
    fixture.detectChanges();

    http.expectOne('/api/v1/chat/status').flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:00:00Z',
      data: {
        enabled: true,
        provider: 'GEMINI',
        model: 'gemini-2.5-flash',
        persistenceEnabled: true,
        historyLimit: 10,
        message: 'Gemini disponible',
      },
    });

    http.expectOne('/api/v1/public/dashboard').flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:00:00Z',
      data: {
        election: { id: 1, name: 'Elección BD', type: 'PRESIDENCIA', round: 'PRIMERA', date: '2026-05-31', state: 'EN_CONTEO' },
        elections: [{ id: 1, name: 'Elección BD', type: 'PRESIDENCIA', round: 'PRIMERA', date: '2026-05-31', state: 'EN_CONTEO' }],
        summary: {}, candidates: [], territories: [],
      },
    });
    await fixture.whenStable();

    component.send('¿Quién lidera?');
    const request = http.expectOne('/api/v1/chat/ask');
    expect(request.request.body.question).toBe('¿Quién lidera?');
    expect(request.request.body.electionId).toBe(1);
    request.flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:00:00Z',
      data: {
        answer: 'María Fernández lidera actualmente la elección.',
        toolsUsed: ['public_dashboard', 'gemini'],
        sessionId: '08e0aa49-cf1f-42aa-a771-95171d95bc3c',
        messageId: 8,
        provider: 'GEMINI',
        model: 'gemini-2.5-flash',
        fallback: false,
        sources: ['Resultados oficiales', 'Gemini', 'PostgreSQL backend'],
        disclaimer: 'Gemini responde con datos enviados por el backend.',
        generatedAt: '2026-07-02T00:00:00Z',
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('María Fernández lidera actualmente');
    expect(content).toContain('Elección BD');
    expect(content).toContain('Resultados oficiales');
    expect(content).toContain('Esta respuesta es informativa');
    expect(content).not.toContain('gemini-2.5-flash');
    expect(content).not.toContain('PostgreSQL');
    expect(content).not.toContain('backend');
    expect(localStorage.getItem('elecciones-public-assistant-session')).toBeTruthy();
  });
});
