/**
 * BUSCADOR DE PACIENTES
 * =====================
 *
 * Campo de búsqueda por DNI o apellido + lista de resultados para elegir uno.
 * Llama a `GET /pacientes?busqueda=` a través de `PacienteService`.
 *
 * Quién lo usa:
 *   - `paginas/nuevo-turno` (operador): "busca al paciente y le asigna un
 *     turno";
 *   - `paginas/medico/historial`: buscar al paciente cuyo historial se consulta;
 *   - `paginas/operador/pacientes`: buscar antes de dar de alta.
 *
 * Emite el paciente elegido por `elegido`; qué hacer con él lo decide la
 * pantalla.
 */

import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PacienteEncontrado } from '../../core/modelos/paciente';
import { PacienteService } from '../../core/servicios/paciente.service';
import { deFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-buscador-pacientes',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
  ],
  templateUrl: './buscador-pacientes.html',
})
export class BuscadorPacientes implements OnInit {
  private readonly pacienteService = inject(PacienteService);

  /** Texto para precargar y buscar al aparecer (por ejemplo, un DNI que llega por la URL). */
  readonly busquedaInicial = input<string | undefined>(undefined);

  /** Se emite cuando el usuario elige un paciente de la lista. */
  readonly elegido = output<PacienteEncontrado>();

  /** Mínimo 2 caracteres, igual que exige el backend. */
  protected readonly busqueda = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });

  /**
   * Grupo que envuelve al campo. Hace falta para el `<form [formGroup]>` del
   * template: sin un `formGroup`, Angular no intercepta el envío del
   * formulario, `(ngSubmit)` nunca se dispara y el navegador hace un submit
   * común que RECARGA la página (el botón "Buscar" parecía no hacer nada).
   */
  protected readonly formulario = new FormGroup({ busqueda: this.busqueda });

  protected readonly resultados = signal<PacienteEncontrado[] | null>(null);
  protected readonly buscando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly deFechaApi = deFechaApi;

  ngOnInit(): void {
    const inicial = this.busquedaInicial();
    if (inicial) {
      this.busqueda.setValue(inicial);
      this.buscar();
    }
  }

  /** Busca con el texto ingresado (`GET /pacientes?busqueda=`). */
  protected buscar(): void {
    if (this.busqueda.invalid) {
      this.busqueda.markAsTouched();
      return;
    }
    this.buscando.set(true);
    this.error.set(null);
    this.pacienteService.buscar(this.busqueda.value.trim()).subscribe({
      next: (pacientes) => {
        this.resultados.set(pacientes);
        this.buscando.set(false);
        // Si la búsqueda vino precargada (un DNI exacto) y hay un solo
        // resultado, se elige solo: ahorra un clic al llegar desde "Asignar
        // turno" en la pantalla de pacientes.
        if (pacientes.length === 1 && this.busquedaInicial()) this.elegir(pacientes[0]);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.buscando.set(false);
      },
    });
  }

  /** Avisa a la pantalla qué paciente se eligió. */
  protected elegir(paciente: PacienteEncontrado): void {
    this.elegido.emit(paciente);
  }
}
