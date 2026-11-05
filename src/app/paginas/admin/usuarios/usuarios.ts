/**
 * PANTALLA "USUARIOS" (rol administrador)
 * =======================================
 *
 * Listado completo de usuarios, paginado desde el backend, con filtros por
 * nombre, apellido, tipo de usuario y sede. Alta de operadores, médicos y
 * administradores y edición de cualquier usuario (incluidos los pacientes),
 * con el formulario `dialogo-usuario`.
 *
 * Ruta: `/admin/usuarios` (opción "Usuarios" de `MENU_POR_ROL.admin`).
 * Servicios:
 *   - `UsuarioService` → `GET/POST/PUT /usuarios`;
 *   - `SedeService`, `EspecialidadService`, `CoberturaService` → los listados
 *     de los selectores del filtro y del formulario.
 *
 * La paginación es del lado del servidor: el `mat-paginator` le pide al
 * backend solo la página visible (`pagina` y `limite`) y muestra el `total`
 * que devuelve. Cada alta y edición queda en la auditoría.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs';
import { Cobertura } from '../../../core/modelos/cobertura';
import { Especialidad } from '../../../core/modelos/especialidad';
import { Sede } from '../../../core/modelos/sede';
import { NOMBRE_ROL, Rol, UsuarioListado } from '../../../core/modelos/usuario';
import { CoberturaService } from '../../../core/servicios/cobertura.service';
import { EspecialidadService } from '../../../core/servicios/especialidad.service';
import { SedeService } from '../../../core/servicios/sede.service';
import { UsuarioService } from '../../../core/servicios/usuario.service';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { DatosDialogoUsuario, DialogoUsuario } from './dialogo-usuario';

@Component({
  selector: 'app-usuarios',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly sedeService = inject(SedeService);
  private readonly especialidadService = inject(EspecialidadService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  protected readonly columnas = ['apellido', 'nombre', 'dni', 'rol', 'sede', 'email', 'acciones'];
  protected readonly roles = Object.keys(NOMBRE_ROL) as Rol[];
  protected readonly NOMBRE_ROL = NOMBRE_ROL;

  /** Filtros de la consigna: nombre, apellido, tipo de usuario y sede. */
  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    nombre: '',
    apellido: '',
    rol: '' as Rol | '',
    id_sede: null as number | null,
  });

  protected readonly usuarios = signal<UsuarioListado[]>([]);
  protected readonly total = signal(0);
  /** Página visible (0 = primera, como cuenta el `mat-paginator`). */
  protected readonly indicePagina = signal(0);
  protected readonly tamanioPagina = signal(10);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  // Listados para los selectores (filtro de sede y formulario de usuario).
  protected readonly sedes = signal<Sede[]>([]);
  private readonly especialidades = signal<Especialidad[]>([]);
  private readonly coberturas = signal<Cobertura[]>([]);

  /**
   * Nombre legible del rol. Existe porque en la fila de la tabla el usuario
   * llega sin tipo (`let usuario` de `mat-table`) y no se puede indexar
   * `NOMBRE_ROL` directamente desde el template.
   */
  protected nombreRol(rol: Rol): string {
    return NOMBRE_ROL[rol] ?? rol;
  }

  ngOnInit(): void {
    this.cargarListadosAuxiliares();
    this.cargar();
  }

  /**
   * Trae sedes, especialidades y coberturas para los selectores. Si alguno
   * falla, el listado de usuarios se muestra igual (con ese selector vacío).
   */
  private cargarListadosAuxiliares(): void {
    forkJoin({
      sedes: this.sedeService.listar().pipe(catchError(() => of<Sede[]>([]))),
      especialidades: this.especialidadService.listar().pipe(catchError(() => of<Especialidad[]>([]))),
      coberturas: this.coberturaService.listarDisponibles().pipe(catchError(() => of<Cobertura[]>([]))),
    }).subscribe(({ sedes, especialidades, coberturas }) => {
      this.sedes.set(sedes);
      this.especialidades.set(especialidades);
      this.coberturas.set(coberturas);
    });
  }

  /** Pide la página actual con los filtros actuales (`GET /usuarios`). */
  protected cargar(): void {
    const filtros = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.usuarioService
      .listar({
        nombre: filtros.nombre.trim(),
        apellido: filtros.apellido.trim(),
        rol: filtros.rol || undefined,
        id_sede: filtros.id_sede ?? undefined,
        // El backend cuenta las páginas desde 1; el paginador, desde 0.
        pagina: this.indicePagina() + 1,
        limite: this.tamanioPagina(),
      })
      .subscribe({
        next: (pagina) => {
          this.usuarios.set(pagina.items);
          this.total.set(pagina.total);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  /** "Buscar": aplica los filtros desde la primera página. */
  protected buscar(): void {
    this.indicePagina.set(0);
    this.cargar();
  }

  /** "Limpiar": borra los filtros y vuelve a la primera página. */
  protected limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  /** El usuario cambió de página o de tamaño de página en el paginador. */
  protected cambiarPagina(evento: PageEvent): void {
    this.indicePagina.set(evento.pageIndex);
    this.tamanioPagina.set(evento.pageSize);
    this.cargar();
  }

  /** Abre el formulario de alta (sin usuario) o de edición; si se guardó, recarga. */
  protected abrirFormulario(usuario: UsuarioListado | null = null): void {
    const datos: DatosDialogoUsuario = {
      usuario,
      sedes: this.sedes(),
      especialidades: this.especialidades(),
      coberturas: this.coberturas(),
    };
    this.dialogo
      .open(DialogoUsuario, { data: datos, width: '640px' })
      .afterClosed()
      .subscribe((guardado?: boolean) => {
        if (!guardado) return;
        this.avisos.open(usuario ? 'Usuario modificado.' : 'Usuario creado.', 'Cerrar', {
          duration: 3000,
        });
        this.cargar();
      });
  }
}
