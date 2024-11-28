//一意の送信識別子（UUID）を生成する関数。重複送信を防ぐために使用します。
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

function doPost(e) {
  try {
    // スプレッドシートのIDとシートのGIDを設定
    const sheetId = 'XXXXXXXXX'; // ここにシートIDを入力
    const sheetGid = 'XXXXXXXXXX'; // ここにタブのGIDを入力

    // スプレッドシートと特定のシートを取得
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheets().find(sheet => sheet.getSheetId() === parseInt(sheetGid));

    // フォームデータを取得
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error(`Invalid JSON data received: ${parseError.message}`);
    }

    // データにUUIDが含まれていない場合は、UUIDを生成します。
    const submissionUUID = data.submissionUUID || generateUUID();
    data.submissionUUID = submissionUUID;


    // UUIDを格納するためのシート（Submissions）を作成します。
    const uuidSheet = spreadsheet.getSheetByName("Submissions");
    if (!uuidSheet) {
        spreadsheet.insertSheet("Submissions");
        uuidSheet = spreadsheet.getSheetByName("Submissions");
        uuidSheet.appendRow(['Submission UUID']);
    }

    // 重複送信をチェックします。SubmissionsシートにUUIDが既に存在する場合は、重複送信とみなします。
    if(uuidSheet.getRange("A1:A").getValues().flat().includes(submissionUUID)) {
        Logger.log("重複送信が検出されました！");
        return ContentService.createTextOutput(JSON.stringify({ result: 'duplicate' })).setMimeType(ContentService.MimeType.JSON);
    }

    Logger.log(data); // ログ出力でデバッグ


    // 1行目が空の場合、列名を設定
    writeHeaderRowIfNeeded(sheet);

    // スプレッドシートに新しいデータを最終行に追加
    sheet.appendRow(prepareDataForSpreadsheet(data));

    // UUIDをSubmissionsシートに追加します。
    uuidSheet.appendRow([submissionUUID]);


    // レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({ result: 'success' })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error); // エラーログ出力
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ヘッダー行を書き込むヘルパー関数。ヘッダー行が存在しない場合にのみ実行します。
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