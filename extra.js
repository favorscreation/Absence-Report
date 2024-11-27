// extra.js
document.getElementById('連絡者').addEventListener('change', function() {
    var その他連絡者 = document.getElementById('その他連絡者');
    if (this.value === 'その他') {
        その他連絡者.style.display = 'block';
        その他連絡者.required = true;
    } else {
        その他連絡者.style.display = 'none';
        その他連絡者.required = false;
    }
});

// 現在の時間を連絡日時に設定する
function setDateTimeNow() {
    var now = new Date();
    var year = now.getFullYear();
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var day = ("0" + now.getDate()).slice(-2);
    var hours = ("0" + now.getHours()).slice(-2);
    var minutes = ("0" + now.getMinutes()).slice(-2);

    // 表示用のフォーマット
    var formattedDate = year + "-" + month + "-" + day;
    var formattedTime = hours + ":" + minutes;

    // フィールドに値を設定
    document.getElementById('連絡日時').value = formattedDate + "T" + formattedTime;
}

// ページ読み込み時に実行
window.onload = setDateTimeNow;
