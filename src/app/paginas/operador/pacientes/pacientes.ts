/**
 * PANTALLA "PACIENTES" (rol operador)
 * ===================================
 *
 * Dos cosas que la consigna le pide al operador:
 *   - ALTA DE PACIENTES, con los mismos datos y validaciones que el registro de
 *     la semana 1: usa el MISMO componente (`compartido/formulario-paciente`),
 *     solo que guarda contra `POST /pacientes` (`PacienteService.crear`);
 *   - punto de partida para ASIGNAR TURNOS: busca al paciente
 *     (`compartido/buscador-pacientes`) y con "Asignar turno" lo lleva a
 *     `/operador/nuevo-turno?dni=…`, donde sigue el mismo flujo que el
 *     paciente con la sede fija en la suya.
 *
 * Ruta: `/operador/pacientes` (opción "Pacientes" de `MENU_POR_ROL.operador`).
 */

import { Component, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BuscadorPacientes } from '../../../compartido/buscador-pacientes/buscador-pacientes';
import { FormularioPaciente } from '../../../compartido/formulario-paciente/formulario-paciente';
import { PacienteEncontrado } from '../../../core/modelos/paciente';
import { DatosRegistro, Usuario } from '../../../core/modelos/usuario';
import { PacienteService } from '../../../core/servicios/paciente.service';

@Component({
  selector: 'app-pacientes',
  imports: [
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    BuscadorPacientes,
    FormularioPaciente,
  ],
  templateUrl: './pacientes.html',
})
export class Pacientes {
  private readonly pacienteService = inject(PacienteService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);

  private readonly formulario = viewChild(FormularioPaciente);

  /** Paciente recién creado, para ofrecer asignarle un turno enseguida. */
  protected readonly creado = signal<Usuario | null>(null);

  /** Cómo guarda el formulario compartido en esta pantalla: `POST /pacientes`. */
  protected readonly crearPaciente = (datos: DatosRegistro): Observable<Usuario> =>
    this.pacienteService.crear(datos);

  /** El formulario confirmó el alta. */
  protected alCrear(usuario: Usuario): void {
    this.creado.set(usuario);
    this.avisos.open(`Paciente ${usuario.apellido}, ${usuario.nombre} creado.`, 'Cerrar', {
      duration: 4000,
    });
    this.formulario()?.reiniciar();
  }

  /** "Asignar turno": abre la solicitud de turno con el paciente precargado por DNI. */
  protected asignarTurno(paciente: PacienteEncontrado | Usuario): void {
    this.router.navigate(['/operador/nuevo-turno'], { queryParams: { dni: paciente.dni } });
  }
}
