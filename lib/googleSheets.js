import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getInventory() {
    // 1. Esto toma los datos directamente de tu archivo .env.local
    // Si algo falla aquí, el error te dirá que la variable no existe.
    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const SPREADSHEET_ID = '1eVNytdcAy2zP0n0bgxVuoHgyDbUA6SGjaV10HjMlD9o';

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['InventarioBot'];
    const rows = await sheet.getRows();

    return rows.map(row => ({
        id: row.get('id'),
        nombre: row.get('nombre'),
        tipo: row.get('tipo'),
        estado: row.get('estado')
    }));
}