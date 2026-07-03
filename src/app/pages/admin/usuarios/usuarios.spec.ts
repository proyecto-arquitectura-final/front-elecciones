import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuarios } from './usuarios';

const user = { id: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastLoginAt: '2026-07-03T00:00:00Z', name: 'Admin', email: 'admin@test.co', role: 'ADMINISTRADOR' as const, active: true };
const management = {
  counters: { total: 1, active: 1, administrators: 1, analysts: 0 },
  users: { items: [user], page: 0, size: 10, totalElements: 1, totalPages: 1 },
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('Usuarios', () => {
  let fixture: ComponentFixture<Usuarios>;
  let component: Usuarios;
  let service: {
    gestion: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      gestion: vi.fn().mockReturnValue(of(management)),
      crear: vi.fn().mockReturnValue(of(user)),
      actualizar: vi.fn().mockReturnValue(of(user)),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [{ provide: UsuarioService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('carga usuarios y contadores desde gestión', () => {
    fixture.detectChanges();
    expect(component.users).toEqual([user]);
    expect(component.stats[2].value).toBe(1);
  });

  it('valida contraseña mínima al crear', () => {
    fixture.detectChanges();
    component.openModal();
    Object.assign(component.form, { name: 'Nuevo', email: 'nuevo@test.co', role: 'ANALISTA', password: '123' });
    component.save();
    expect(component.formError).toContain('8 caracteres');
    expect(service.crear).not.toHaveBeenCalled();
  });

  it('crea un usuario con contrato tipado', () => {
    fixture.detectChanges();
    component.openModal();
    Object.assign(component.form, { name: ' Nuevo ', email: 'NUEVO@TEST.CO', role: 'ANALISTA', password: '12345678' });
    component.save();
    expect(service.crear).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nuevo', email: 'nuevo@test.co', role: 'ANALISTA' }));
  });

  it('conserva usuarios ante error temporal', () => {
    fixture.detectChanges();
    service.gestion.mockReturnValueOnce(throwError(() => ({ error: { message: 'Sin conexión' } })));
    component.load(true);
    expect(component.users).toHaveLength(1);
    expect(component.error).toBe('Sin conexión');
  });
});
