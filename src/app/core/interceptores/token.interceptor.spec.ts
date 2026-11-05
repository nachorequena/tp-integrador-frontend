/**
 * PRUEBAS: interceptor del token
 *
 * Agrega el JWT solo a la API propia y, ante un 401 de una petición con
 * token (token vencido, o rol/sede cambiados por el admin), cierra la sesión
 * y lleva al login.
 */

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SesionService } from '../servicios/sesion.service';
import { tokenInterceptor } from './token.interceptor';

describe('tokenInterceptor', () => {
  const token = signal<string | null>('jwt-de-prueba');
  const sesionFalsa = { token, cerrar: vi.fn(() => token.set(null)) };
  let http: HttpClient;
  let servidor: HttpTestingController;

  beforeEach(() => {
    token.set('jwt-de-prueba');
    sesionFalsa.cerrar.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: SesionService, useValue: sesionFalsa },
      ],
    });
    http = TestBed.inject(HttpClient);
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => servidor.verify());

  it('agrega Authorization: Bearer a las peticiones de la API', () => {
    http.get(`${environment.apiUrl}/turnos/mios`).subscribe();
    const pedido = servidor.expectOne(`${environment.apiUrl}/turnos/mios`);
    expect(pedido.request.headers.get('Authorization')).toBe('Bearer jwt-de-prueba');
    pedido.flush({});
  });

  it('no manda el token a otros servidores', () => {
    http.get('https://otro-servidor.com/datos').subscribe();
    const pedido = servidor.expectOne('https://otro-servidor.com/datos');
    expect(pedido.request.headers.has('Authorization')).toBe(false);
    pedido.flush({});
  });

  it('ante un 401 cierra la sesión, va al login y deja pasar el error', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let recibioError = false;
    http.get(`${environment.apiUrl}/agendas`).subscribe({ error: () => (recibioError = true) });

    servidor
      .expectOne(`${environment.apiUrl}/agendas`)
      .flush(
        { codigo: 401, estado: 'Tus datos de acceso cambiaron (rol o sede).', datos: null },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(sesionFalsa.cerrar).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/login']);
    expect(recibioError).toBe(true);
  });
});
