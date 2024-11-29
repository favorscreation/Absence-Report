function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: "OK"})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const requestBody = e.parameter;
  const spreadsheetId = requestBody.spreadsheetsID;
  const sheetIdentifier = requestBody.spreadsheetsGID;
  const identifierType = requestBody.sheetType;

  return doPostLibrary(requestBody, spreadsheetId, sheetIdentifier, identifierType);
}

/**
 * 連絡票のデータをスプレッドシートに追加します。
 *
 * @param {Object} requestBody - リクエストボディの内容。
 * @param {string} spreadsheetId - スプレッドシートID。
 * @param {string} sheetIdentifier - シートGIDまたはシート名。
 * @param {string} identifierType - シート識別子のタイプ ("gid" または "name")。
 * @returns {Object} - 実行結果を含むオブジェクト。
 */
function doPostLibrary(requestBody, spreadsheetId, sheetIdentifier, identifierType) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet;
    if (identifierType === 'gid') {
      sheet = ss.getSheets().find(s => s.getSheetId() === parseInt(sheetIdentifier));
    } else if (identifierType === 'name') {
      sheet = ss.getSheetByName(sheetIdentifier);
    } else {
      throw new Error(`Invalid identifierType: ${identifierType}`);
    }

    if (!sheet) {
      throw new Error(`Sheet not found: ${sheetIdentifier} (${identifierType})`);
    }

    // データにUUIDが含まれていない場合は、UUIDを生成します。
    const submissionUUID = requestBody.submissionUUID || generateUUID();
    requestBody.submissionUUID = submissionUUID;

    // UUIDを格納するためのシート（Submissions）を作成または取得します。
    let uuidSheet = ss.getSheetByName("Submissions");
    if (!uuidSheet) {
      uuidSheet = ss.insertSheet("Submissions");
      uuidSheet.appendRow(['Submission UUID']);
    }

    // 重複送信をチェックします。SubmissionsシートにUUIDが既に存在する場合は、重複送信とみなします。
    const uuidRange = uuidSheet.getRange("A1:A").getValues().flat();
    if (uuidRange.includes(submissionUUID)) {
      Logger.log("重複送信が検出されました！");
      return ContentService.createTextOutput(JSON.stringify({ result: 'duplicate' })).setMimeType(ContentService.MimeType.JSON);
    }

    writeHeaderRowIfNeeded(sheet); // ヘッダー行を追加
    sheet.appendRow(prepareDataForSpreadsheet(requestBody)); // データをシートに追加
    uuidSheet.appendRow([submissionUUID]); // UUIDを記録

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(`ライブラリ内でエラーが発生しました: ${error}`); // エラーログ出力
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ヘッダー行を書き込むヘルパー関数
function writeHeaderRowIfNeeded(sheet) {
  if (sheet.getRange(1, 1).isBlank()) {
    const headerRow = [
      '担当者', '利用者氏名', '連絡日時', '連絡者', 'その他の連絡者', '連絡方法', '種別', '事由',
      '開始日時', '終了日時', '支援時刻1', '相談支援・助言1', '支援時刻2', '相談支援・助言2',
      '当日の状況', '次回通所日', '加算の有無', '昼食キャンセル負担', 'Submission UUID'
    ];
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  }
}

// スプレッドシートに書き込むデータ配列を作成するヘルパー関数
function prepareDataForSpreadsheet(data) {
  return [
    data.responsiblePerson || '',
    data.userName || '',
    data.contactDateTime || '',
    data.contactPerson || '',
    data.otherContactPerson || '',
    data.contactMethod || '',
    data.category || '',
    data.reason || '',
    data.startDateTime || '',
    data.endDateTime || '',
    data.supportTime1 || '',
    data.supportAdvice1 || '',
    data.supportTime2 || '',
    data.supportAdvice2 || '',
    data.currentSituation || '',
    data.nextVisitDate || '',
    data.additionalSupport || '',
    data.lunchCancel || '',
    data.submissionUUID || ''
  ];
}

// UUIDを生成する関数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
