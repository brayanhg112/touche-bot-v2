import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function test() {
  const serviceAccountAuth = new JWT({
      email: "bot-inventario@mineral-actor-492623-d9.iam.gserviceaccount.com",
      key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC1jjXXR0LjTZt0\nDUCtGGm3Pzagt80gsE7mKXnoDba1F6mYhmu7kbTNs4WzOZCQT+RN9vtS4QgM30UM\nKqmFVi88BphNdhPy8BYf9KflMi3d5AOD5jjePpappIakX8tcI6QKuvTYV2uB8yXP\no4hwuio44iquzb1TRK1g8TJxlZifPfGhMAEWAsp9ntMhydl0p0A+bwC6LDq0jwyw\nNG394B1l4IYkHl9W/FG9RKJU4lg7jcHREq+q8la+L4+lOo4lyerI1o33mkBHQzGL\nbJooqLEiravBTSbm5oGWk5Boo5L6IePvOsYRj0VDsL5MVKI7CFElL58E5WB0K1pZ\nRSAWz7I/AgMBAAECggEAGvBJFzJuKiRI8B0f9G8Tud+/HyAWkjFG4QoqGfSgSwTX\nTRfeOAcZy48bGVRDGdPuMrlLt5OclQMIj5JsSSoCuTEwplxiVQuAT5PcLlBV6Ood\nBr8BaiHhoLXrpSEc9K90dtkgXPy0/s5RVRqqiIYUShDDjOC0elH4OH2hYqQem2Xz\nyZ859Z56fRsgBYfXaTAIBfVYicCt8MuxSmHYSiPJlrXkqI61pnF+3BDeXi3NNthl\nlbdmejBI9ZF7o5aHfs8DD1+GwitnrLhgHUasAghyUO32XSeKyniBtxTplOvNiY6C\nLUqBmm5oJtgVtJJnTGV6lD88fxJS3nfci7mVDAoS7QKBgQDskP/T4pEw86ZDkiO4\nK9vdk3p4Cz3rguyAj6phAhUsjlPzzOOWluYSoJ0iPbtlBIlI0geE8j5czpErKF5Z\nfv9czH1x7/mng2rOZF3HxvwHFroXMQ8w8tllcvvx6hFd1BQ3tUyVwx67hGuULTPz\ny6yDO83h4wLFr1Ci7uMYM0aRxQKBgQDEeFRpkidcjVrxU/ichm8vhm09TfYmQwG3\n9C0ViRwLsdm7kZ2iKlKCBuuhO9wJkhuChxodc2Wak+ZfH8VUluT41V/S1oC3KN/+\n2+t9L0dTXd3lu5KvJhXELlWY+qUdgu5P6PxePQmpegsvKu6cyMAlrDjiCbWWoMks\nkbBcjhCIMwKBgEl/+5xPhqDY8s2HuEVeix9a1PA7Pe/Qa7695Efjp8SCLB9Rh1yg\nYbdj465h07ldIXJYnzF1Ol8HZx8rmbTgumKQvmEKGF0tfZ/Gm0SY1HE3ZHYULg4d\nReI5SYIuIVsvq2BrmfHl/8RvLiWJrdyPaXgUurD2IUReZgVZh4FbXQ+pAoGAHAbi\nW9EKpmxPzd9htsqCr+/oQ3eMpramVxyRFeJiStTLL7O9HfYVoRDlqjGE2SSrofot\n4oekteFlWqqIluGTtl+R9Ny+reI52fx7YndNIHpifjQ835l6P2swsMsIpOYZovKk\nlbj1WOTdFZR1R45nwrgHwU8LRXqYWDBMTVfCyfsCgYBbs0kJkaY7ER0yN+PyMAkm\nOMnFmi/Kp71B/zEL2lEa32pknOCT7wNSjvM0apkpe8IpTQcvA5vfF6QaOj673BJT\nYdP+yHNzV/UmHo4AxJgUXAA03NU4KqerXQilndGZOKJ+Sqwiph2guqTaVyVMdzdl\nuEqO0AAal4UToiq4lJXfsA==\n-----END PRIVATE KEY-----\n",
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const doc = new GoogleSpreadsheet("1eVNytdcAy2zP0n0bgxVuoHgyDbUA6SGjaV10HjMlD9o", serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['InventarioBot'] || doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  
  for(let i=0; i<3; i++) {
      console.log('Row ' + i + ' rawData:', rows[i].toObject());
      console.log('Row ' + i + ' raw (array):', rows[i]._rawData);
  }
}

test().catch(console.error);
