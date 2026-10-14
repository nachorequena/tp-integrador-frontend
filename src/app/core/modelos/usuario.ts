/**
 * MODELOS DE USUARIO Y SESIÓN
 * ===========================
 *
 * Los nombres de las propiedades replican EXACTAMENTE los que manda el backend
 * (que a su vez son las columnas de la tabla `usuario`). Por eso aparecen
 * `fecha_nacimiento` o `id_cobertura` con guion bajo: renombrarlos obligaría a
 * traducir en cada servicio y abriría la puerta a errores.
 */

/** Los cuatro roles que existen en la base, tal cual están en la columna `rol`. */
export type Rol = 'admin' | 'operador' | 'medico' | 'paciente';

/**
 * Usuario tal como lo devuelve la API: nunca incluye la `password`.
 *
 * `id_sede` solo tiene valor para el personal de la clínica e `id_cobertura`
 * solo para los pacientes; el resto de los casos llega `null`.
 */
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  /** Formato `YYYY-MM-DD`, sin hora ni zona horaria. */
  fecha_nacimiento: string;
  rol: Rol;
  id_sede: number | null;
  id_cobertura: number | null;
}

/** Lo que devuelve `POST /auth/login` dentro de `datos`. */
export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

/** Cuerpo de `POST /auth/login`. */
export interface DatosLogin {
  dni: string;
  password: string;
}

/**
 * Cuerpo de `POST /auth/registro`.
 *
 * Incluye `telefono` aunque la consigna no lo liste: en la base es `NOT NULL`
 * sin valor por defecto y el backend lo exige (ver el README del backend).
 */
export interface DatosRegistro {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  telefono: string;
  /** Formato `YYYY-MM-DD`. */
  fecha_nacimiento: string;
  id_cobertura: number;
}

/** Nombre legible de cada rol, para mostrarlo en pantalla. */
export const NOMBRE_ROL: Record<Rol, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  medico: 'Médico',
  paciente: 'Paciente',
};
