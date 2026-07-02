import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { AuditEvent } from '../../../core/models/audit.model';

@Component({ selector: 'app-auditoria', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './auditoria.html', styleUrl: './auditoria.scss' })
export class Auditoria implements OnInit {
  filtroUsuario=''; filtroAccion=''; filtroEntidad=''; filtroEstado=''; eventos: AuditEvent[]=[]; error='';
  constructor(private readonly auditoriaService: AuditoriaService) {}
  ngOnInit(): void { this.cargar(); }
  cargar(): void { this.auditoriaService.listar().subscribe({next:d=>this.eventos=d.reverse(),error:e=>{this.error='No se pudo cargar auditoría';console.error(e);}}); }
  get stats(){ const total=this.eventos.length; const ok=this.eventos.filter(e=>e.success).length; const fail=total-ok; const users=new Set(this.eventos.map(e=>e.username)).size; return [{label:'Total Eventos',value:total,sub:'Histórico backend',icon:'🗃',iconClass:'icon-blue',valueClass:''},{label:'Operaciones Exitosas',value:ok,sub:total?`${Math.round(ok*100/total)}% tasa de éxito`:'Sin datos',icon:'🛡',iconClass:'icon-green',valueClass:''},{label:'Operaciones Fallidas',value:fail,sub:'Requieren revisión',icon:'🛡',iconClass:'icon-red',valueClass:'red'},{label:'Usuarios Activos',value:users,sub:'Con acciones registradas',icon:'👤',iconClass:'icon-purple',valueClass:''}]; }
  get eventosFiltrados(){ return this.eventos.filter(e=>(!this.filtroUsuario||(e.username||'').toLowerCase().includes(this.filtroUsuario.toLowerCase()))&&(!this.filtroAccion||e.action===this.filtroAccion)&&(!this.filtroEntidad||e.entity===this.filtroEntidad)&&(!this.filtroEstado||(this.filtroEstado==='Exitoso'?e.success:!e.success))); }
  getAccionClass(a:string){ if(a==='CREATE')return 'accion-create'; if(a==='UPDATE')return 'accion-update'; if(a==='DELETE')return 'accion-delete'; return 'accion-login'; }
}
