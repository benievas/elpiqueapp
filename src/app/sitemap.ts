import { MetadataRoute } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchpro.ar';

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
          setAll: () => {
            // No-op para sitemap
          },
        },
      }
    );

    // Obtener complejos
    const { data: complejos } = await supabase
      .from('complexes')
      .select('slug, updated_at')
      .eq('activo', true);

    // Obtener torneos
    const { data: torneos } = await supabase
      .from('tournaments')
      .select('slug, updated_at')
      .eq('es_publico', true);

    const sitemap: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/explorar`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/mapa`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/torneos`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/feed`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      // Complejos dinámicos
      ...(complejos?.map((c) => ({
        url: `${baseUrl}/complejo/${c.slug}`,
        lastModified: new Date(c.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })) || []),
      // Torneos dinámicos
      ...(torneos?.map((t) => ({
        url: `${baseUrl}/torneos/${t.slug}`,
        lastModified: new Date(t.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })) || []),
    ];

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Retornar sitemap básico si hay error
    return [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://matchpro.ar',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ];
  }
}
