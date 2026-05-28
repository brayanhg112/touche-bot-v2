import Papa from 'papaparse';

const url = 'https://docs.google.com/spreadsheets/d/1rIU-p4HhfTdd3-Tyst-sVz19AxkeyfPY9DVaG0NGIVc/export?format=csv';

async function test() {
  const res = await fetch(url);
  const text = await res.text();
  
  Papa.parse(text, {
    complete: function(results) {
      console.log('Total rows:', results.data.length);
      for(let i=0; i<Math.min(50, results.data.length); i++) {
        const row = results.data[i];
        console.log(`[${i}] N(13):${row[13]} | P(15):${row[15]} | S(18):${row[18]} | U(20):${row[20]}`);
      }
    }
  });
}

test();
