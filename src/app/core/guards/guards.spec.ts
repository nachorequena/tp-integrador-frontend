/**
 * PRUEBAS: guards de sesión y de rol
 *
 * Comprueba que una URL escrita a mano no saltee la protección: sin sesión se
 * va al login (con `?volver=`), y con otro rol a "Acceso denegado".
 */

import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Rol } from '../modelos/usuario';
import { SesionService } from '../servicios/sesion.service';
import { rolGuard } from './rol.guard';
import { sesionGuard } from './sesion.guard';

describe('guards', () => {
  // Sesión falsa: solo lo que leen los guards.
  const rol = signal<Rol | null>(null);
  const sesionFalsa = { rol, haySesion: computed(() => rol() !== null) };

  const ejecutar = (guard: typeof sesionGuard, url = '/paciente/mis-turnos') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  const destino = (resultado: unknown) =>
    TestBed.inject(Router).serializeUrl(resultado as UrlTree);

  beforeEach(() => {
    rol.set(null);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SesionService, useValue: sesionFalsa }],
    });
  });

  it('sesionGuard manda al login y recuerda la URL pedida', () => {
    expect(destino(ejecutar(sesionGuard))).toBe('/login?volver=%2Fpaciente%2Fmis-turnos');
  });

  it('sesionGuard deja pasar con sesión', () => {
    rol.set('paciente');
    expect(ejecutar(sesionGuard)).toBe(true);
  });

  it('rolGuard deja pasar al rol correcto', () => {
    rol.set('paciente');
    expect(ejecutar(rolGuard('paciente'))).toBe(true);
  });

  it('rolGuard manda a "Acceso denegado" a otro rol', () => {
    rol.set('medico');
    expect(destino(ejecutar(rolGuard('paciente')))).toBe('/acceso-denegado');
  });
});
