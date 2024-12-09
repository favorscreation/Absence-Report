// グローバル定数
const HEADER_ROW = [
  '利用者氏名', '連絡日時', '担当者', '連絡者', '連絡方法', '種別', '事由',
  '開始日時', '終了日時', '支援時刻1', '相談支援・助言1', '支援時刻2', '相談支援・助言2',
  '当日の状況', '次回通所日', '加算の有無', '昼食キャンセル負担', '受信日時', 'submissionUUID' // submissionUUID を追加
];

const HEADER_TO_FIELD_MAPPING = {
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
  '受信日時': 'receivedTime',
  'submissionUUID': 'submissionUUID' // submissionUUID を追加
};

// スプレッドシート操作関数群
function getSpreadsheetName(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    return createSuccessResponse({ name: ss.getName() });
  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function doPostLibrary(requestBody, spreadsheetId, sheetIdentifier, identifierType) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = getSheetByIdentifier(ss, sheetIdentifier, identifierType);
    if (!sheet) throw new Error(`シートが見つかりません: ${sheetIdentifier}`); // エラーメッセージに識別子を追加

    // requestBody の null チェックを追加
    if (!requestBody) throw new Error("リクエストボディが空です。");

    requestBody.submissionUUID = requestBody.submissionUUID || generateUUID();

    if (isDuplicateSubmission(sheet, requestBody.submissionUUID)) {
      return createSuccessResponse({ result: 'duplicate' });
    }

    writeHeaderRowIfNeeded(sheet, HEADER_ROW);

    const rowData = prepareDataForSpreadsheet(requestBody);
    rowData.push(requestBody.submissionUUID); // submissionUUID を追加
    rowData[HEADER_ROW.indexOf('受信日時')] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss"); // タイムゾーンを指定
    sheet.appendRow(rowData);

    return createSuccessResponse({ result: 'success', submissionUUID: requestBody.submissionUUID });
  } catch (error) {
    Logger.log(`Error: ${error.message}`, error); // エラーオブジェクト全体をログに出力
    return createErrorResponse(`エラーが発生しました: ${error.message}`);
  }
}

function getSheetByIdentifier(ss, sheetIdentifier, identifierType) {
  if (identifierType === 'gid') {
    const sheet = ss.getSheets().find(s => s.getSheetId() === parseInt(sheetIdentifier));
    if (!sheet) return null; // シートが見つからない場合は null を返す
    return sheet;
  } else if (identifierType === 'name') {
    return ss.getSheetByName(sheetIdentifier);
  }
  throw new Error(`不正な識別子タイプ: ${identifierType}`); // エラーメッセージに識別子を追加
}

function isDuplicateSubmission(sheet, submissionUUID) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // 行数が2行未満（ヘッダー行のみ）の場合は重複なしとみなす

  const uuidRange = sheet.getRange(2, HEADER_ROW.indexOf('submissionUUID') + 1, lastRow - 1, 1).getValues().flat();
  return uuidRange.includes(submissionUUID);
}


function writeHeaderRowIfNeeded(sheet, headerRow) {
  if (sheet.getRange(1, 1).isBlank()) {
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  }
}

// データ変換関数群
function prepareDataForSpreadsheet(data) {
  return HEADER_ROW.slice(0, -1).map(header => data[convertHeaderToField(header)] || ''); // submissionUUID を除外
}

function convertHeaderToField(header) {
  return HEADER_TO_FIELD_MAPPING[header] || header;
}

// ユーティリティ関数群
function generateUUID() {
  return Utilities.getUuid(); // より安全なUUID生成関数を使用
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message })).setMimeType(ContentService.MimeType.JSON);
}


// Webアプリケーション関連の関数群
function doGet(e) {
  if (e.parameter.spreadsheetId) {
    return getSpreadsheetName(e.parameter.spreadsheetId);
  }
  return createSuccessResponse({ status: "OK" });
}

function doPost(e) {
  // パラメータのバリデーションを追加
  const { spreadsheetsId, sheetIdentifier, sheetType } = e.parameter;
  if (!spreadsheetsId || !sheetIdentifier || !sheetType) {
    return createErrorResponse("必須パラメータが不足しています。");
  }

  const requestBody = handleContactPerson(e.parameter);
  return doPostLibrary(requestBody, spreadsheetsId, sheetIdentifier, sheetType);
}

function handleContactPerson(params) {
  const { contactPerson, otherContactPerson, ...rest } = params;
  return {
    ...rest,
    contactPerson: contactPerson === 'その他' ? otherContactPerson : contactPerson
  };
}