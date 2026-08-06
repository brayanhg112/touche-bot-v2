const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function test() {
  const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['InventarioBot'] || doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  
  for(let i=0; i<3; i++) {
      console.log('Row ' + i + ' raw (array):', rows[i]._rawData);
  }
}

test().catch(console.error);
