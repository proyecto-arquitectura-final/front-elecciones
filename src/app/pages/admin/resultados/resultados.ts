import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultadoService } from '../../../core/services/resultado.service';
import { EleccionService } from '../../../core/services/eleccion.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { OfficialResult } from '../../../core/models/result.model';
import { Election } from '../../../core/models/election.model';
import { Candidate } from '../../../core/models/candidate.model';

@Component({ selector: 'app-resultados', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './resultados.html', styleUrl: './resultados.scss' })
export class Resultados implements OnInit {
  resultados: OfficialResult[]=[]; elecciones:Election[]=[]; candidatos:Candidate[]=[]; modalAbierto=false; error=''; form:any=this.formVacio();
  cargaOpciones=[{icon:'⬆',iconClass:'icon-blue',titulo:'Carga Manual',sub:'Registrar resultado oficial'},{icon:'🔄',iconClass:'icon-green',titulo:'API Registraduría',sub:'Sincronizar mock'},{icon:'⬇',iconClass:'icon-purple',titulo:'Exportar Consolidado',sub:'Usa módulo de reportes'}];
  constructor(private readonly resultadoService:ResultadoService, private readonly eleccionService:EleccionService, private readonly candidatoService:CandidatoService) {}
  ngOnInit():void{this.cargar(); this.eleccionService.listar().subscribe(d=>this.elecciones=d); this.candidatoService.listar().subscribe(d=>this.candidatos=d);}
  cargar():void{this.resultadoService.listar().subscribe({next:d=>this.resultados=d,error:e=>{this.error='No se pudieron cargar los resultados';console.error(e);}});}
  get votosTotales(){return this.resultados.reduce((s,r)=>s+(r.votes||0),0);} get mesasReportadas(){return this.resultados.reduce((s,r)=>s+(r.reportedTables||0),0);} get mesasTotales(){return this.resultados.reduce((s,r)=>s+(r.totalTables||0),0);} get pctMesas(){return this.mesasTotales?Math.round(this.mesasReportadas*1000/this.mesasTotales)/10:0;}
  abrirModal(){this.form=this.formVacio();this.modalAbierto=true;} cerrarModal(){this.modalAbierto=false;this.error='';}
  guardar(){ if(!this.form.electionId||!this.form.candidateId){this.error='Selecciona elección y candidato.';return;} const req:OfficialResult={electionId:Number(this.form.electionId),candidateId:Number(this.form.candidateId),department:this.form.department,municipality:this.form.municipality,votes:Number(this.form.votes||0),percentage:Number(this.form.percentage||0),reportedTables:Number(this.form.reportedTables||0),totalTables:Number(this.form.totalTables||0),participation:Number(this.form.participation||0),source:'MANUAL_FRONT'}; this.resultadoService.crear(req).subscribe({next:()=>{this.cerrarModal();this.cargar();},error:e=>{this.error='No se pudo guardar el resultado';console.error(e);}}); }
  sincronizar(){this.resultadoService.sincronizarRegistraduria().subscribe({next:()=>this.cargar(),error:e=>{this.error='No se pudo sincronizar';console.error(e);}});}
  getEstadoClass(){return 'badge-procesado';} getValidClass(){return 'badge-aprobado';}
  private formVacio(){return {electionId:'',candidateId:'',department:'Quindío',municipality:'Armenia',votes:0,percentage:0,reportedTables:0,totalTables:0,participation:0};}
}
