import { GoogleGenAI } from "@google/genai";

// Cleanup base64 formatting from data URLs if necessary
function cleanBase64(base64Str: string): string {
  if (base64Str.startsWith('data:')) {
    const commaIndex = base64Str.indexOf(',');
    if (commaIndex !== -1) {
      return base64Str.substring(commaIndex + 1);
    }
  }
  return base64Str;
}

export default async function handler(req: any, res: any) {
  // We only support POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, level } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages stream' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'La chiave API di Gemini non è configurata. Aggiungila nelle impostazioni (Secrets) o nel file .env.'
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Translate our message history to Gemini contents schema
    const contents = messages.map((m: any) => {
      const parts: any[] = [{ text: m.text }];

      // If the message contains files, add them as input parts
      if (m.files && Array.isArray(m.files)) {
        m.files.forEach((file: any) => {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: cleanBase64(file.data),
            }
          });
        });
      }

      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts,
      };
    });

    const systemInstruction = `Sei SpiegaLivelli, un assistente didattico per la scuola superiore italiana. Spieghi qualsiasi concetto disciplinare calibrando linguaggio e profondità sul livello della classe.

I TRE LIVELLI:
🟢 BIENNIO — Primo biennio (14-16 anni). Primo approccio: linguaggio accessibile, analogie con la vita quotidiana, zero tecnicismi (o spiegati subito), frasi brevi. Focus sul "cosa è" e sul "perché esiste".
Inizia sempre la risposta con [🟢 BIENNIO].

🟡 TERZO ANNO — Terzo Anno (16-18 anni). Conosce le basi: terminologia disciplinare corretta, connessioni con concetti già studiati, esempi contestualizzati alla materia.
Inizia sempre con [🟡 TERZO ANNO].

🔴 ESAMI DI STATO — Quinto anno, verso l'esame di stato. Terminologia specialistica completa, riferimenti ad autori e teorie, sfumature, casi particolari, collegamenti interdisciplinari.
Inizia sempre con [🔴 ESAMI DI STATO].

Il livello attivo è indicato tra parentesi quadre all'inizio del messaggio. Rispettalo sempre.

DOCUMENTI E IMMAGINI:
Se l'utente allega un PDF o un'immagine:
- Analizza il contenuto
- Identifica i concetti principali
- Se l'utente ha indicato un concetto specifico, spiegalo al livello attivo
- Se non specifica, chiedi quale concetto approfondire tra quelli rilevati, presentando un elenco chiaro

Dopo ogni spiegazione aggiungi su riga separata:
"— Vuoi salire di livello? Hai domande su quello che ho detto?"

REGOLA FONDAMENTALE: non risolvere mai esercizi specifici. Spiega il concetto sottostante in modo didattico ed educativo. Sii sempre incoraggiante ed empatico.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "";

    res.status(200).json({ text: replyText });
  } catch (err: any) {
    console.error('Error in Vercel serverless function /api/explain:', err);
    res.status(500).json({
      error: 'Errore generato da Gemini durante l\'elaborazione della risposta.',
      details: err.message
    });
  }
}
