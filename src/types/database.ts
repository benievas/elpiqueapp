export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── ENUMS ────────────────────────────────────────────────────────────────────
export type UserRole = "jugador" | "propietario" | "admin" | "superadmin";
export type Deporte = "futbol" | "padel" | "tenis" | "voley" | "basquet" | "hockey" | "squash";
export type EstadoReserva = "pendiente" | "confirmada" | "cancelada" | "completada";
export type EstadoTorneo = "registracion" | "en_curso" | "finalizado";
export type EstadoCancha = "disponible" | "ocupada" | "mantenimiento";
export type TipoPublicacion = "promo" | "noticia" | "evento" | "torneo" | "consejo";
export type TipoTorneo = "liga" | "fixture" | "eliminatorio" | "mixto";
export type EstadoPartido = "pendiente" | "en_juego" | "finalizado";

// ─── DATABASE INTERFACE ────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
      };
      complexes: {
        Row: Complex;
        Insert: ComplexInsert;
        Update: Partial<ComplexInsert>;
      };
      courts: {
        Row: Court;
        Insert: CourtInsert;
        Update: Partial<CourtInsert>;
      };
      court_availability: {
        Row: CourtAvailability;
        Insert: CourtAvailabilityInsert;
        Update: Partial<CourtAvailabilityInsert>;
      };
      reservations: {
        Row: Reservation;
        Insert: ReservationInsert;
        Update: Partial<ReservationInsert>;
      };
      reviews: {
        Row: Review;
        Insert: ReviewInsert;
        Update: Partial<ReviewInsert>;
      };
      tournaments: {
        Row: Tournament;
        Insert: TournamentInsert;
        Update: Partial<TournamentInsert>;
      };
      tournament_teams: {
        Row: TournamentTeam;
        Insert: TournamentTeamInsert;
        Update: Partial<TournamentTeamInsert>;
      };
      tournament_matches: {
        Row: TournamentMatch;
        Insert: TournamentMatchInsert;
        Update: Partial<TournamentMatchInsert>;
      };
      feed_posts: {
        Row: FeedPost;
        Insert: FeedPostInsert;
        Update: Partial<FeedPostInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      deporte: Deporte;
      estado_reserva: EstadoReserva;
      estado_torneo: EstadoTorneo;
      estado_cancha: EstadoCancha;
      tipo_publicacion: TipoPublicacion;
      tipo_torneo: TipoTorneo;
      estado_partido: EstadoPartido;
    };
  };
}

// ─── ROW TYPES ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;                        // UUID — refs auth.users
  rol: UserRole;
  nombre_completo: string | null;
  email: string;
  avatar_url: string | null;
  telefono: string | null;
  ciudad: string;                    // Catamarca
  created_at: string;
  updated_at: string;
}
export interface ProfileInsert {
  id: string;
  rol?: UserRole;
  nombre_completo?: string | null;
  email: string;
  avatar_url?: string | null;
  telefono?: string | null;
  ciudad?: string;
}

export interface Complex {
  id: string;
  nombre: string;
  slug: string;
  deporte_principal: Deporte;
  deportes: Deporte[];               // array de deportes disponibles
  descripcion: string | null;
  imagen_principal: string | null;
  galeria: string[];                 // array de URLs de fotos
  video_url: string | null;
  lat: number;
  lng: number;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  whatsapp: string;
  horario_abierto: string;           // ej: "06:00"
  horario_cierre: string;            // ej: "23:00"
  dias_abiertos: string[];           // ["lunes", "martes", ...]
  servicios: string[];               // ["vestuarios", "estacionamiento", "bar", ...]
  precio_promedio: number | null;
  rating_promedio: number | null;
  total_reviews: number;
  ai_resumen: string | null;
  ai_resumen_updated_at: string | null;
  owner_id: string;                  // refs profiles.id (propietario)
  activo: boolean;
  created_at: string;
  updated_at: string;
}
export interface ComplexInsert {
  nombre: string;
  slug: string;
  deporte_principal: Deporte;
  deportes?: Deporte[];
  descripcion?: string | null;
  imagen_principal?: string | null;
  galeria?: string[];
  video_url?: string | null;
  lat: number;
  lng: number;
  ciudad: string;
  direccion: string;
  telefono?: string | null;
  whatsapp: string;
  horario_abierto: string;
  horario_cierre: string;
  dias_abiertos?: string[];
  servicios?: string[];
  precio_promedio?: number | null;
  owner_id: string;
  activo?: boolean;
}

export interface Court {
  id: string;
  complex_id: string;                // refs complexes.id
  nombre: string;
  deporte: Deporte;
  descripcion: string | null;
  imagen_principal: string | null;
  galeria: string[];
  precio_por_hora: number;
  capacidad_jugadores: number;
  tiene_iluminacion: boolean;
  superficie: string;                // "sintetico", "cesped", "polvo_ladrillo", etc.
  estado: EstadoCancha;
  activa: boolean;
  descuento_express: boolean;
  descuento_pct: number;
  created_at: string;
  updated_at: string;
}
export interface CourtInsert {
  complex_id: string;
  nombre: string;
  deporte: Deporte;
  descripcion?: string | null;
  imagen_principal?: string | null;
  galeria?: string[];
  precio_por_hora: number;
  capacidad_jugadores?: number;
  tiene_iluminacion?: boolean;
  superficie?: string;
  estado?: EstadoCancha;
  activa?: boolean;
  descuento_express?: boolean;
  descuento_pct?: number;
}

export interface CourtAvailability {
  id: string;
  court_id: string;                  // refs courts.id
  fecha: string;                     // ISO date (YYYY-MM-DD)
  hora_inicio: string;               // HH:MM
  hora_fin: string;                  // HH:MM
  disponible: boolean;
  reservation_id: string | null;     // refs reservations.id si está ocupada
  created_at: string;
  updated_at: string;
}
export interface CourtAvailabilityInsert {
  court_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible?: boolean;
  reservation_id?: string | null;
}

export interface Reservation {
  id: string;
  court_id: string;                  // refs courts.id
  complex_id: string;                // refs complexes.id (desnormalizado)
  user_id: string;                   // refs profiles.id (jugador)
  fecha: string;                     // ISO date
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
  estado: EstadoReserva;
  notas_usuario: string | null;
  whatsapp_link: string | null;      // link pre-generado para enviar por WA
  confirmada_por_propietario: boolean;
  created_at: string;
  updated_at: string;
}
export interface ReservationInsert {
  court_id: string;
  complex_id: string;
  user_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
  estado?: EstadoReserva;
  notas_usuario?: string | null;
  whatsapp_link?: string | null;
  confirmada_por_propietario?: boolean;
}

export interface Review {
  id: string;
  court_id: string;                  // refs courts.id
  complex_id: string;                // refs complexes.id (desnormalizado)
  user_id: string;                   // refs profiles.id
  estrellas: number;                 // 1–5
  texto: string | null;
  fotos: string[];                   // array de URLs
  reservation_id: string | null;     // refs reservations.id
  created_at: string;
}
export interface ReviewInsert {
  court_id: string;
  complex_id: string;
  user_id: string;
  estrellas: number;
  texto?: string | null;
  fotos?: string[];
  reservation_id?: string | null;
}

export interface Tournament {
  id: string;
  nombre: string;
  slug: string;
  deporte: Deporte;
  tipo: TipoTorneo;
  descripcion: string | null;
  imagen_url: string | null;
  complex_id: string;                // refs complexes.id (dueño del torneo)
  fecha_inicio: string;              // ISO datetime
  fecha_fin: string | null;
  cupos_totales: number;
  cupos_ocupados: number;
  precio_inscripcion: number;
  estado: EstadoTorneo;
  es_publico: boolean;
  created_by: string;                // refs profiles.id
  created_at: string;
  updated_at: string;
}
export interface TournamentInsert {
  nombre: string;
  slug: string;
  deporte: Deporte;
  tipo: TipoTorneo;
  descripcion?: string | null;
  imagen_url?: string | null;
  complex_id: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  cupos_totales: number;
  precio_inscripcion?: number;
  estado?: EstadoTorneo;
  es_publico?: boolean;
  created_by: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;             // refs tournaments.id
  nombre: string;
  foto_url: string | null;
  miembros: string[];                // array de nombres
  miembros_ids: string[];            // array de user IDs
  puntos: number;
  posicion: number | null;
  created_at: string;
}
export interface TournamentTeamInsert {
  tournament_id: string;
  nombre: string;
  foto_url?: string | null;
  miembros?: string[];
  miembros_ids?: string[];
  puntos?: number;
  posicion?: number | null;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;             // refs tournaments.id
  ronda: number;                     // 1, 2, 3... para el bracket
  team_a_id: string | null;          // refs tournament_teams.id
  team_b_id: string | null;
  puntaje_a: number | null;
  puntaje_b: number | null;
  estado: EstadoPartido;
  fecha: string | null;              // ISO datetime
  court_id: string | null;           // refs courts.id
  created_at: string;
  updated_at: string;
}
export interface TournamentMatchInsert {
  tournament_id: string;
  ronda: number;
  team_a_id?: string | null;
  team_b_id?: string | null;
  puntaje_a?: number | null;
  puntaje_b?: number | null;
  estado?: EstadoPartido;
  fecha?: string | null;
  court_id?: string | null;
}

export interface FeedPost {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  contenido: string;
  imagen_principal: string | null;
  galeria: string[];
  complex_id: string;                // refs complexes.id (quién publica)
  autor_id: string;                  // refs profiles.id
  visible: boolean;
  fecha_expiracion: string | null;   // ISO datetime
  created_at: string;
  updated_at: string;
}
export interface FeedPostInsert {
  tipo: TipoPublicacion;
  titulo: string;
  contenido: string;
  imagen_principal?: string | null;
  galeria?: string[];
  complex_id: string;
  autor_id: string;
  visible?: boolean;
  fecha_expiracion?: string | null;
}
