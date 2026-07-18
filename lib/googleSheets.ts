import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface InventoryItem {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
}

export async function getInventory(): Promise<InventoryItem[]> {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Sheets credentials are not set in environment variables');
    }

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const SPREADSHEET_ID = '1eVNytdcAy2zP0n0bgxVuoHgyDbUA6SGjaV10HjMlD9o';

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['InventarioBot'];
    
    if (!sheet) {
        throw new Error('Sheet "InventarioBot" not found in the spreadsheet');
    }

    const rows = await sheet.getRows();

    return rows.map(row => ({
        id: row.get('id')?.toString() ?? '',
        nombre: row.get('nombre')?.toString() ?? '',
        tipo: row.get('tipo')?.toString() ?? '',
        estado: row.get('estado')?.toString() ?? '',
    }));
}
