import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getInventory() {
    try {
        // 1. Cargamos las credenciales desde las variables de entorno
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        // 2. Aquí pones tu ID de Google Sheet (es la cadena larga de tu URL)
        const SPREADSHEET_ID = '1eVNytdcAy2zP0n0bgxVuoHgyDbUA6SGjaV10HjMlD9o';

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['InventarioBot'];
        const rows = await sheet.getRows();

        // 3. Retornamos los datos limpios
        return rows.map(row => ({
            id: row.get('id'),
            nombre: row.get('nombre'),
            tipo: row.get('tipo'),
            estado: row.get('estado')
        }));
    } catch (error) {
        console.error('Error al conectar con Google Sheets:', error);
        throw error;
    }
}