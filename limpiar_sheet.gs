/**
 * limpiar_sheet.gs — Limpieza segura y marcado visual para InventarioBot
 *
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheet -> Extensiones -> Apps Script.
 * 2. Pega este código completo y guarda.
 * 3. Ejecuta la función `limpiarYResaltarInventarioBot` una sola vez.
 *
 * QUÉ HACE:
 * a) Corrige automáticamente ÚNICAMENTE dos typos seguros:
 *    - ocasion: "CITA ROMATICA" -> "CITA ROMANTICA"
 *    - familia_olfativa: "DULCE" -> "DULCES"
 * b) Resalta con fondo rojo suave (#FCE8E6) y añade una nota en la columna B
 *    a TODAS las filas problemáticas (datos cruzados con "ACTIVO", vacíos,
 *    "C" en nombre, "Vendido" en Col A, género pegado al nombre y duplicados).
 *    NO sobrescribe ningún dato de negocio automáticamente.
 */
function limpiarYResaltarInventarioBot() {
  var SHEET_NAME = 'InventarioBot';
  var HIGHLIGHT_COLOR = '#FCE8E6';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('No se encontró la pestaña "' + SHEET_NAME + '".');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('La pestaña InventarioBot no tiene filas de datos.');
    return;
  }

  var dataRange = sheet.getRange(1, 1, lastRow, 8);
  var values = dataRange.getValues();

  // Detectar índices de columnas por cabecera (fila 1)
  var headers = values[0].map(function (h) {
    return String(h || '').trim().toLowerCase();
  });

  var colId = 0;
  var colName = findCol(headers, ['nombre'], 1);
  var colTipo = findCol(headers, ['tipo'], 2);
  var colEstado = findExactCol(headers, 'estado', 3);
  var colFamilia = findCol(headers, ['familia'], 4);
  var colOcasion = findCol(headers, ['ocasion', 'ocasión'], 5);
  var colIntensidad = findCol(headers, ['intensidad'], 6);
  var colGenero = findCol(headers, ['genero', 'género'], 7);

  var fixedCitaCount = 0;
  var fixedDulceCount = 0;

  // Primer pase: corregir únicamente los 2 typos seguros y detectar duplicados
  var slugRows = {};
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rawOcc = String(row[colOcasion] || '').trim();
    var rawFam = String(row[colFamilia] || '').trim();

    if (rawOcc.toUpperCase() === 'CITA ROMATICA') {
      values[i][colOcasion] = 'CITA ROMANTICA';
      sheet.getRange(i + 1, colOcasion + 1).setValue('CITA ROMANTICA');
      fixedCitaCount++;
    }

    if (rawFam.toUpperCase() === 'DULCE') {
      values[i][colFamilia] = 'DULCES';
      sheet.getRange(i + 1, colFamilia + 1).setValue('DULCES');
      fixedDulceCount++;
    }

    var rawName = String(row[colName] || '').trim();
    var slug = normalizeSlug(rawName);
    if (slug && rawName.length > 2) {
      if (!slugRows[slug]) slugRows[slug] = [];
      slugRows[slug].push(i + 1);
    }
  }

  // Segundo pase: limpiar colores/notas previas en A2:H y resaltar filas problemáticas
  sheet.getRange(2, 1, lastRow - 1, 8).setBackground(null);
  sheet.getRange(2, colName + 1, lastRow - 1, 1).clearNote();

  var highlightedCount = 0;

  for (var r = 1; r < values.length; r++) {
    var rowNum = r + 1;
    var rVals = values[r];
    var idVal = String(rVals[colId] || '').trim();
    var nameVal = String(rVals[colName] || '').trim();
    var tipoVal = String(rVals[colTipo] || '').trim();
    var estadoVal = String(rVals[colEstado] || '').trim();
    var famVal = String(rVals[colFamilia] || '').trim();
    var occVal = String(rVals[colOcasion] || '').trim();
    var intVal = String(rVals[colIntensidad] || '').trim();
    var genVal = String(rVals[colGenero] || '').trim();

    var reasons = [];

    // Fila completamente vacía
    if (!idVal && !nameVal && !estadoVal && !famVal && !occVal && !intVal && !genVal) {
      reasons.push('Fila vacía (eliminar o completar)');
    } else {
      if (idVal.toUpperCase() === 'VENDIDO') {
        reasons.push('Columna A tiene "Vendido" en lugar del ID');
      }
      if (!nameVal || nameVal.length <= 2) {
        reasons.push('nombre_perfume corrupto ("' + nameVal + '") — revisar ID: "' + idVal + '"');
      }
      if (/hombre$|mujer$/i.test(nameVal)) {
        reasons.push('Género pegado al final de nombre_perfume ("' + nameVal + '")');
      }
      if (['ACTIVO', 'INACTIVO'].indexOf(estadoVal.toUpperCase()) === -1) {
        reasons.push('estado vacío o inválido ("' + estadoVal + '")');
      }
      if (
        famVal.toUpperCase() === 'ACTIVO' ||
        occVal.toUpperCase() === 'ACTIVO' ||
        intVal.toUpperCase() === 'ACTIVO'
      ) {
        reasons.push('Datos cruzados: "ACTIVO" metido en familia/ocasión/intensidad');
      }
      if (!genVal) {
        reasons.push('genero vacío');
      }
      if (estadoVal.toUpperCase() === 'ACTIVO') {
        if (!famVal) reasons.push('ACTIVO sin familia_olfativa');
        if (!occVal) reasons.push('ACTIVO sin ocasion');
        if (!intVal) reasons.push('ACTIVO sin intensidad');
      }
      if (!tipoVal) {
        reasons.push('Tipo vacío');
      }
      var slugKey = normalizeSlug(nameVal);
      if (slugKey && slugRows[slugKey] && slugRows[slugKey].length > 1) {
        reasons.push('Referencia duplicada en filas: ' + slugRows[slugKey].join(', '));
      }
    }

    if (reasons.length > 0) {
      sheet.getRange(rowNum, 1, 1, 8).setBackground(HIGHLIGHT_COLOR);
      sheet.getRange(rowNum, colName + 1).setNote('⚠️ Revisar:\n• ' + reasons.join('\n• '));
      highlightedCount++;
    }
  }

  var msg =
    '✅ Limpieza de InventarioBot completada:\n' +
    '• CITA ROMATICA → CITA ROMANTICA corregidas: ' + fixedCitaCount + '\n' +
    '• DULCE → DULCES corregidas: ' + fixedDulceCount + '\n' +
    '• Filas problemáticas resaltadas en rojo suave: ' + highlightedCount + '\n\n' +
    'Pasa el cursor sobre la columna nombre_perfume de las filas rojas para ver el motivo exacto.';

  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // Ejecutado desde disparador sin UI
  }
}

function findCol(headers, keywords, fallbackIdx) {
  for (var i = 0; i < headers.length; i++) {
    for (var k = 0; k < keywords.length; k++) {
      if (headers[i].indexOf(keywords[k]) !== -1) return i;
    }
  }
  return fallbackIdx;
}

function findExactCol(headers, exact, fallbackIdx) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === exact) return i;
  }
  return fallbackIdx;
}

function normalizeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
