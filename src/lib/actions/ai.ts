'use server';

import { z } from 'zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Validación
const GenerateDescriptionSchema = z.object({
  sport: z.string().min(1),
  capacity: z.number().min(2),
  services: z.array(z.string()).optional(),
});

const GeneratePostSchema = z.object({
  eventName: z.string().min(3),
  date: z.string().date(),
  sport: z.string().min(1),
  complexName: z.string().min(1),
});

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in Gemini response');
    }

    return content;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function generateCourtDescription(data: unknown): Promise<{
  success: boolean;
  description?: string;
  error?: string;
}> {
  try {
    const validated = GenerateDescriptionSchema.parse(data);

    const prompt = `Eres un experto en marketing deportivo.
Genera una descripción atractiva y profesional para una cancha de ${validated.sport}
que puede albergar ${validated.capacity} jugadores.
${validated.services?.length ? `Servicios disponibles: ${validated.services.join(', ')}` : ''}

La descripción debe ser de 2-3 frases, específica y dirigida a jugadores potenciales.
NO incluyas formatos markdown o asteriscos, solo texto limpio.`;

    const description = await callGeminiAPI(prompt);

    return {
      success: true,
      description,
    };
  } catch (error) {
    console.error('Error generating description:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function generateInstagramPost(data: unknown): Promise<{
  success: boolean;
  post?: string;
  error?: string;
}> {
  try {
    const validated = GeneratePostSchema.parse(data);

    const prompt = `Eres un experto en redes sociales para negocios deportivos.
Genera un post divertido y atractivo para Instagram sobre:
- Evento: ${validated.eventName}
- Deporte: ${validated.sport}
- Fecha: ${validated.date}
- Complejo: ${validated.complexName}

El post debe:
- Incluir emojis relevantes
- Tener hashtags en español
- Ser viral y llamar a la acción
- Máximo 280 caracteres
- NO incluya formatos markdown

Solo devuelve el contenido del post, sin explicaciones.`;

    const post = await callGeminiAPI(prompt);

    return {
      success: true,
      post,
    };
  } catch (error) {
    console.error('Error generating post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
