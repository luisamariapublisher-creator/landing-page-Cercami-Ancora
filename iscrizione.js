// Vercel Serverless Function: riceve nome/email dal modulo, li salva nel foglio Google
// (tramite l'app web di Apps Script) e restituisce il link ai bonus.
// Variabili d'ambiente richieste su Vercel:
//   SHEET_WEBHOOK_URL  URL dell'app web di Apps Script (finisce con /exec)
//   SHEET_SECRET       la stessa parola segreta scritta nello script
//   BONUS_URL          link della cartella Google Drive con i bonus

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, errore: 'Metodo non consentito' });
  }

  const { SHEET_WEBHOOK_URL, SHEET_SECRET, BONUS_URL } = process.env;
  if (!SHEET_WEBHOOK_URL || !SHEET_SECRET || !BONUS_URL) {
    return res.status(500).json({ ok: false, errore: 'Configurazione mancante sul server' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const nome = String(body?.nome || '').trim().slice(0, 80);
  const email = String(body?.email || '').trim().slice(0, 160);
  const privacy = body?.privacy === true;
  const novita = body?.novita === true;
  const trappola = String(body?.sito || ''); // campo nascosto anti-spam

  if (trappola) return res.status(200).json({ ok: true, bonus: BONUS_URL });
  if (!nome) return res.status(400).json({ ok: false, errore: 'Scrivi il tuo nome.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ ok: false, errore: "Controlla l'indirizzo email." });
  }
  if (!privacy) return res.status(400).json({ ok: false, errore: "Serve il consenso all'informativa privacy." });

  try {
    const r = await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: SHEET_SECRET, nome, email, privacy, novita, fonte: 'libro' }),
      redirect: 'follow',
    });
    const testo = await r.text();
    let esito = {};
    try { esito = JSON.parse(testo); } catch { /* risposta non JSON */ }
    if (!esito.ok) {
      console.error('Apps Script:', r.status, testo.slice(0, 300));
      return res.status(502).json({ ok: false, errore: 'Non sono riuscita a registrarti. Riprova tra poco.' });
    }
    return res.status(200).json({ ok: true, bonus: BONUS_URL });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ ok: false, errore: 'Connessione non riuscita. Riprova tra poco.' });
  }
}
