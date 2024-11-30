function doGet(e) {
  if (e.parameter.spreadsheetId) {
    return getSpreadsheetName(e.parameter.spreadsheetId);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "OK" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const { spreadsheetsID, spreadsheetsGID, sheetType, contactPerson, otherContactPerson, ...requestBody } = e.parameter;

  if (contactPerson === 'その他') {
    requestBody.contactPerson = otherContactPerson;
  } else {
    requestBody.contactPerson = contactPerson;
  }

  return doPostLibrary(requestBody, spreadsheetsID, spreadsheetsGID, sheetType);
}

function getSpreadsheetName(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    return ContentService.createTextOutput(JSON.stringify({ name: ss.getName() })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPostLibrary(requestBody, spreadsheetId, sheetIdentifier, identifierType) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = getSheetByIdentifier(ss, sheetIdentifier, identifierType);
    if (!sheet) throw new Error(`Sheet not found: ${sheetIdentifier} (${identifierType})`);

    const submissionUUID = requestBody.submissionUUID || generateUUID();
    requestBody.submissionUUID = submissionUUID;

    if (isDuplicateSubmission(sheet, submissionUUID)) {
      return ContentService.createTextOutput(JSON.stringify({ result: 'duplicate' })).setMimeType(ContentService.MimeType.JSON);
    }

    const headerRow = [
      '利用者氏名', '連絡日時', '担当者', '連絡者', '連絡方法', '種別', '事由',
      '開始日時', '終了日時', '支援時刻1', '相談支援・助言1', '支援時刻2', '相談支援・助言2',
      '当日の状況', '次回通所日', '加算の有無', '昼食キャンセル負担', '受信日時'
    ];

    writeHeaderRowIfNeeded(sheet, headerRow);
    const now = new Date();
    const rowData = prepareDataForSpreadsheet(requestBody, headerRow);
    rowData[headerRow.indexOf('受信日時')] = now; // '受信日時'を適切な位置に追加
    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetByIdentifier(ss, sheetIdentifier, identifierType) {
  if (identifierType === 'gid') {
    return ss.getSheets().find(s => s.getSheetId() === parseInt(sheetIdentifier));
  } else if (identifierType === 'name') {
    return ss.getSheetByName(sheetIdentifier);
  }
  throw new Error(`Invalid identifierType: ${identifierType}`);
}

function isDuplicateSubmission(sheet, submissionUUID) {
  const uuidRange = sheet.getRange("Q2:Q").getValues().flat();
  return uuidRange.includes(submissionUUID);
}

function writeHeaderRowIfNeeded(sheet, headerRow) {
  if (sheet.getRange(1, 1).isBlank()) {
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  }
}

function prepareDataForSpreadsheet(data, headerRow) {
  return headerRow.map(header => {
    const field = convertHeaderToField(header);
    return data.hasOwnProperty(field) ? data[field] : '';
  });
}

function convertHeaderToField(header) {
  const headerMapping = {
    '担当者': 'responsiblePerson',
    '利用者氏名': 'userName',
    '連絡日時': 'contactDateTime',
    '連絡者': 'contactPerson',
    '連絡方法': 'contactMethod',
    '種別': 'category',
    '事由': 'reason',
    '開始日時': 'startDateTime',
    '終了日時': 'endDateTime',
    '支援時刻1': 'supportTime1',
    '相談支援・助言1': 'supportAdvice1',
    '支援時刻2': 'supportTime2',
    '相談支援・助言2': 'supportAdvice2',
    '当日の状況': 'currentSituation',
    '次回通所日': 'nextVisitDate',
    '加算の有無': 'additionalSupport',
    '昼食キャンセル負担': 'lunchCancel',
    '受信日時': 'receivedTime'
  };
  return headerMapping[header] || header;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
