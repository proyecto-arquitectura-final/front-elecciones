import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppUser, UserRole } from '../../../core/models/user.model';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {

  busqueda = '';
  modalAbierto = false;
  modoEdicion = false;
  cargando = false;
  guardando = false;
  error = '';

  form: any = this.formVacio();

  stats = [
    { label: 'Total Usuarios',  value: '0', sub: 'Registrados en el sistema', icon: '👥', iconClass: 'icon-blue'   },
    { label: 'Activos',         value: '0', sub: 'Con acceso habilitado',      icon: '👤', iconClass: 'icon-green'  },
    { label: 'Administradores', value: '0', sub: 'Permisos completos',         icon: '🛡', iconClass: 'icon-purple' },
    { label: 'Analistas',       value: '0', sub: 'Lectura y escritura',        icon: '👤', iconClass: 'icon-orange' },
  ];

  usuarios: any[] = [];

  roles = [
    {
      nombre: 'Administrador',
      badge: 'Full Access',
      badgeClass: 'badge-full',
      desc: 'Acceso completo al sistema: gestión de usuarios, configuración de elecciones, carga de resultados, generación de reportes y auditoría.'
    },
    {
      nombre: 'Analista',
      badge: 'Read & Write',
      badgeClass: 'badge-rw',
      desc: 'Puede consultar y apoyar el análisis de candidatos, partidos, encuestas, resultados, predicciones y reportes.'
    },
  ];

  constructor(private readonly usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  get usuariosFiltrados() {
    const filtro = this.busqueda.toLowerCase().trim();

    return this.usuarios.filter(u =>
      !filtro ||
      u.nombre.toLowerCase().includes(filtro) ||
      u.correo.toLowerCase().includes(filtro)
    );
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';

    this.usuarioService.listar().subscribe({
      next: data => {
        this.usuarios = data.map(u => this.toView(u));
        this.actualizarStats();
        this.cargando = false;
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudieron cargar los usuarios.';
        this.cargando = false;
        console.error('Error cargando usuarios:', err);
      }
    });
  }

  abrirModal(u?: any): void {
    this.error = '';
    this.guardando = false;
    this.modoEdicion = !!u;

    this.form = u
      ? {
          id: u.id,
          nombre: u.nombre,
          correo: u.correo,
          rol: u.rol,
          rolClass: u.rolClass,
          activo: u.activo,
          password: ''
        }
      : this.formVacio();

    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (this.guardando) {
      return;
    }

    this.modalAbierto = false;
    this.modoEdicion = false;
    this.error = '';
    this.guardando = false;
    this.form = this.formVacio();
  }

  actualizarRolClass(): void {
    const map: any = {
      'Administrador': 'rol-admin',
      'Analista': 'rol-analista'
    };

    this.form.rolClass = map[this.form.rol] || '';
  }

  guardar(): void {
    if (this.guardando) {
      return;
    }

    this.error = '';

    if (!this.form.nombre || !this.form.correo || !this.form.rol) {
      this.error = 'Completa nombre, correo y rol.';
      return;
    }

    if (!this.modoEdicion && !this.form.password) {
      this.error = 'La contraseña temporal es obligatoria.';
      return;
    }

    if (!this.modoEdicion && this.form.password.length < 8) {
      this.error = 'La contraseña debe tener mínimo 8 caracteres.';
      return;
    }

    const request: AppUser = {
      name: String(this.form.nombre).trim(),
      email: String(this.form.correo).trim(),
      password: this.form.password || undefined,
      role: this.toApiRole(this.form.rol),
      active: this.form.activo
    };

    this.guardando = true;

    const action$ = this.modoEdicion && this.form.id
      ? this.usuarioService.actualizar(this.form.id, request)
      : this.usuarioService.crear(request);

    action$.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.modoEdicion = false;
        this.form = this.formVacio();
        this.error = '';
        this.cargarUsuarios();
      },
      error: err => {
        this.guardando = false;
        this.error = err?.error?.message || 'No se pudo guardar el usuario.';
        console.error('Error guardando usuario:', err);
      }
    });
  }

  eliminar(u: any): void {
    if (!u.id || this.guardando) {
      return;
    }

    if (confirm(`¿Eliminar usuario "${u.nombre}"?`)) {
      this.usuarioService.eliminar(u.id).subscribe({
        next: () => this.cargarUsuarios(),
        error: err => {
          this.error = err?.error?.message || 'No se pudo eliminar el usuario.';
          console.error('Error eliminando usuario:', err);
        }
      });
    }
  }

  private actualizarStats(): void {
    this.stats[0].value = String(this.usuarios.length);
    this.stats[1].value = String(this.usuarios.filter(u => u.activo).length);
    this.stats[2].value = String(this.usuarios.filter(u => u.rol === 'Administrador').length);
    this.stats[3].value = String(this.usuarios.filter(u => u.rol === 'Analista').length);
  }

  private toView(u: AppUser): any {
    const rol = this.toViewRole(u.role);

    return {
      id: u.id,
      nombre: u.name,
      correo: u.email,
      rol,
      rolClass: rol === 'Administrador' ? 'rol-admin' : 'rol-analista',
      ultimoAcceso: 'No registrado',
      activo: u.active,
      password: ''
    };
  }

  private toViewRole(role: string): string {
    return role === 'ADMINISTRADOR' ? 'Administrador' : 'Analista';
  }

  private toApiRole(role: string): UserRole {
    return role === 'Administrador' ? 'ADMINISTRADOR' : 'ANALISTA';
  }

  private formVacio() {
    return {
      id: null as number | null,
      nombre: '',
      correo: '',
      rol: '',
      rolClass: '',
      activo: true,
      password: ''
    };
  }
}