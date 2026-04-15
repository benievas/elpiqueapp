'use server';

import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const ComplexSchema = z.object({
  nombre: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  deporte_principal: z.enum(['futbol', 'padel', 'tenis', 'voley', 'basquet', 'hockey', 'squash']),
  deportes: z.array(z.string()).min(1),
  descripcion: z.string().min(10).max(500).optional(),
  ciudad: z.enum(['Catamarca', 'Buenos Aires', 'Mendoza']),
  direccion: z.string().min(5).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  telefono: z.string().regex(/^\+?[0-9]{10,}$/).optional(),
  whatsapp: z.string().regex(/^[0-9]{10,}$/),
  horario_abierto: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  horario_cierre: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  dias_abiertos: z.array(z.string()).optional(),
  servicios: z.array(z.string()).optional(),
});

export async function createComplex(data: unknown) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Validar datos
    const validated = ComplexSchema.parse(data);

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('No autenticado');
    }

    // Crear complejo
    const { data: complex, error } = await supabase
      .from('complexes')
      .insert({
        ...validated,
        owner_id: user.id,
        activo: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: complex };
  } catch (err) {
    console.error('Error creating complex:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function updateComplex(id: string, data: unknown) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const validated = ComplexSchema.partial().parse(data);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No autenticado');

    const { data: complex, error } = await supabase
      .from('complexes')
      .update(validated)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: complex };
  } catch (err) {
    console.error('Error updating complex:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function deleteComplex(id: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('complexes')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Error deleting complex:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
