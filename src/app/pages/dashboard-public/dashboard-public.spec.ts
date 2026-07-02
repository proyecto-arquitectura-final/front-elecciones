import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardPublic } from './dashboard-public';

describe('DashboardPublic', () => {
  let component: DashboardPublic;
  let fixture: ComponentFixture<DashboardPublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPublic, CommonModule, FormsModule, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPublic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on resultados view', () => {
    expect(component.vistaActiva).toBe('resultados');
  });

  it('should switch to predicciones view', () => {
    component.setVista('predicciones');
    expect(component.vistaActiva).toBe('predicciones');
  });

  it('should switch to asistente view', () => {
    component.setVista('asistente');
    expect(component.vistaActiva).toBe('asistente');
  });

  it('should have 4 candidatos', () => {
    expect(component.candidatos.length).toBe(4);
  });

  it('should have initial bot message in chat', () => {
    expect(component.mensajes.length).toBe(1);
    expect(component.mensajes[0].tipo).toBe('bot');
  });

  it('should send a message and receive a response', async () => {
    component.enviarMensaje('Ver predicciones');
    expect(component.mensajes.length).toBe(2);
    expect(component.mensajes[1].tipo).toBe('user');
    await new Promise(resolve => setTimeout(resolve, 1500));
    expect(component.mensajes.length).toBe(3);
    expect(component.mensajes[2].tipo).toBe('bot');
  });

  it('should not send empty message', () => {
    component.enviarMensaje('   ');
    expect(component.mensajes.length).toBe(1);
  });
});