/**
 * Cercami Ancora – registrazione dei lettori nel foglio "leed libro Cercami Ancora".
 * Da incollare in: foglio Google > Estensioni > Apps Script (sostituendo tutto il contenuto).
 * Poi: Esegui il deployment > Nuovo deployment > Tipo "App web"
 *      Esegui come: Me · Chi ha accesso: Chiunque  → copia l'URL dell'app web.
 *
 * SEGRETO: scegli una parola lunga a caso (es. 30 lettere e numeri) e scrivila
 * qui sotto. La stessa identica parola va nella variabile SHEET_SECRET su Vercel.
 */
const SEGRETO = 'SCRIVI-QUI-LA-TUA-PAROLA-SEGRETA';

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SEGRETO) return risposta({ ok: false, errore: 'non autorizzato' });

    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Data', 'Nome', 'Email', 'Consenso privacy', 'Consenso novità', 'Provenienza']);
      sh.getRange(1, 1, 1, 6).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    const email = String(d.email || '').trim().toLowerCase();
    // niente doppioni: se l'email c'è già, non la riscrive
    const esistenti = sh.getLastRow() > 1
      ? sh.getRange(2, 3, sh.getLastRow() - 1, 1).getValues().flat().map(String)
      : [];
    if (!esistenti.includes(email)) {
      sh.appendRow([
        new Date(),
        String(d.nome || '').trim(),
        email,
        d.privacy ? 'Sì' : 'No',
        d.novita ? 'Sì' : 'No',
        String(d.fonte || 'libro'),
      ]);
    }
    return risposta({ ok: true });
  } catch (err) {
    return risposta({ ok: false, errore: String(err) });
  }
}

function risposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
