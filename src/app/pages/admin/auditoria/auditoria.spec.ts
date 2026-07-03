import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { Auditoria } from './auditoria';

const management = {
  counters: { total: 2, successful: 1, failed: 1, users: 2 },
  events: {
    items: [
      { id: 1, at: '2026-07-03T00:00:00Z', username: 'admin@test.co', action: 'CREATE', entity: 'AppUser', entityId: 2, details: 'Creación', ip: '127.0.0.1', success: true },
      { id: 2, at: '2026-07-02T23:00:00Z', username: 'system', action: 'FAIL', entity: 'QA', entityId: null, details: 'Error', ip: '127.0.0.1', success: false },
    ],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
  },
  actions: ['CREATE', 'FAIL'],
  entities: ['AppUser', 'QA'],
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('Auditoria', () => {
  let fixture: ComponentFixture<Auditoria>;
  let component: Auditoria;
  let service: { gestion: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = { gestion: vi.fn().mockReturnValue(of(management)) };
    await TestBed.configureTestingModule({
      imports: [Auditoria],
      providers: [{ provide: AuditoriaService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(Auditoria);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('carga contadores y eventos reales al iniciar', () => {
    fixture.detectChanges();
    expect(component.management?.counters.total).toBe(2);
    expect(component.events).toHaveLength(2);
    expect(service.gestion).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 20 }));
  });

  it('envía filtros al backend y reinicia la página', () => {
    fixture.detectChanges();
    component.page = 3;
    component.search = 'admin';
    component.status = 'false';
    component.applyFilters();
    expect(service.gestion).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'admin', success: false, page: 0 }));
  });

  it('conserva datos anteriores cuando una actualización falla', () => {
    fixture.detectChanges();
    service.gestion.mockReturnValueOnce(throwError(() => ({ error: { message: 'Temporal' } })));
    component.load(true);
    expect(component.events).toHaveLength(2);
    expect(component.error).toBe('Temporal');
  });
});
