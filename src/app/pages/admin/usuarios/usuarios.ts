import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AppUser, UserManagement, UserRequest, UserRole } from '../../../core/models/user.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { refreshView } from '../../../core/utils/zoneless-view.util';

interface UserForm {
  id: number | null;
  name: string;
  email: string;
  role: UserRole | '';
  active: boolean;
  password: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private autoRefresh?: Subscription;

  management?: UserManagement;
  search = '';
  page = 0;
  readonly size = 10;
  loading = false;
  refreshing = false;
  saving = false;
  error = '';
  formError = '';
  modalOpen = false;
  deleteTarget?: AppUser;
  form: UserForm = this.emptyForm();

  readonly roles = [
    {
      name: 'Administrador',
      badge: 'Acceso total',
      description:
        'Gestiona usuarios, elecciones, encuestas, resultados, reportes y registros de auditoría.',
    },
    {
      name: 'Analista',
      badge: 'Consulta y exportación',
      description:
        'Consulta información electoral, predicciones y reportes sin administrar usuarios ni modificar configuración protegida.',
    },
  ];

  constructor(private readonly usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.load(false);
    this.autoRefresh = interval(60_000).subscribe(() => this.load(true));
  }

  ngOnDestroy(): void {
    this.autoRefresh?.unsubscribe();
  }

  get users(): AppUser[] {
    return this.management?.users.items ?? [];
  }

  get totalPages(): number {
    return this.management?.users.totalPages ?? 0;
  }

  get stats() {
    const counters = this.management?.counters;
    return [
      { label: 'Total de usuarios', value: counters?.total ?? 0, sub: 'Registrados en el sistema', icon: '👥', class: 'blue' },
      { label: 'Activos', value: counters?.active ?? 0, sub: 'Con acceso habilitado', icon: '✓', class: 'green' },
      { label: 'Administradores', value: counters?.administrators ?? 0, sub: 'Con permisos completos', icon: '🛡', class: 'purple' },
      { label: 'Analistas', value: counters?.analysts ?? 0, sub: 'Consulta y exportación', icon: '👤', class: 'orange' },
    ];
  }

  load(background = false): void {
    if (this.loading || this.refreshing) return;
    this.error = '';
    if (background && this.management) this.refreshing = true;
    else this.loading = true;

    this.usuarioService
      .gestion(this.search, this.page, this.size)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.management = data;
          this.page = data.users.page;
          this.loading = false;
          this.refreshing = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No fue posible actualizar los usuarios.';
          this.loading = false;
          this.refreshing = false;
        },
      });
  }

  applySearch(): void {
    this.page = 0;
    this.load(false);
  }

  clearSearch(): void {
    this.search = '';
    this.page = 0;
    this.load(false);
  }

  changePage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages || nextPage === this.page) return;
    this.page = nextPage;
    this.load(false);
  }

  openModal(user?: AppUser): void {
    this.formError = '';
    this.form = user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          password: '',
        }
      : this.emptyForm();
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
    this.formError = '';
    this.form = this.emptyForm();
  }

  save(): void {
    if (this.saving || !this.validateForm()) return;
    const request: UserRequest = {
      name: this.form.name.trim(),
      email: this.form.email.trim().toLowerCase(),
      role: this.form.role as UserRole,
      active: this.form.active,
    };
    if (this.form.password) request.password = this.form.password;

    this.saving = true;
    this.formError = '';
    const operation = this.form.id
      ? this.usuarioService.actualizar(this.form.id, request)
      : this.usuarioService.crear(request);
    operation.pipe(refreshView(this.cdr)).subscribe({
      next: () => {
        this.saving = false;
        this.modalOpen = false;
        this.form = this.emptyForm();
        this.load(false);
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'No fue posible guardar el usuario.';
      },
    });
  }

  requestDelete(user: AppUser): void {
    this.error = '';
    this.deleteTarget = user;
  }

  cancelDelete(): void {
    if (!this.saving) this.deleteTarget = undefined;
  }

  confirmDelete(): void {
    if (!this.deleteTarget || this.saving) return;
    this.saving = true;
    this.usuarioService
      .eliminar(this.deleteTarget.id)
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: () => {
          this.saving = false;
          this.deleteTarget = undefined;
          if (this.users.length === 1 && this.page > 0) this.page--;
          this.load(false);
        },
        error: (err) => {
          this.saving = false;
          this.deleteTarget = undefined;
          this.error = err?.error?.message || 'No fue posible eliminar el usuario.';
        },
      });
  }

  roleLabel(role: UserRole): string {
    return role === 'ADMINISTRADOR' ? 'Administrador' : 'Analista';
  }

  trackById(_: number, user: AppUser): number {
    return user.id;
  }

  private validateForm(): boolean {
    this.formError = '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.role) {
      this.formError = 'Completa el nombre, correo y rol.';
      return false;
    }
    if (!emailPattern.test(this.form.email.trim())) {
      this.formError = 'Ingresa un correo electrónico válido.';
      return false;
    }
    if (!this.form.id && this.form.password.length < 8) {
      this.formError = 'La contraseña temporal debe tener al menos 8 caracteres.';
      return false;
    }
    if (this.form.password && this.form.password.length < 8) {
      this.formError = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return false;
    }
    return true;
  }

  private emptyForm(): UserForm {
    return { id: null, name: '', email: '', role: '', active: true, password: '' };
  }
}
