document.addEventListener('DOMContentLoaded', function () {
    const contactPersonSelect = document.getElementById('contactPerson');
    const otherContactPersonInput = document.getElementById('otherContactPerson');

    contactPersonSelect.addEventListener('change', function () {
        otherContactPersonInput.style.display = (this.value === 'その他') ? 'block' : 'none';
        otherContactPersonInput.required = (this.value === 'その他');
    });

    const supportAdvice1 = document.getElementById('supportAdvice1');
    const supportTime1 = document.getElementById('supportTime1');
    const supportAdvice2 = document.getElementById('supportAdvice2');
    const supportTime2 = document.getElementById('supportTime2');

    supportAdvice1.addEventListener('input', function () {
        toggleRequired(supportTime1, this.value.trim());
    });

    supportAdvice2.addEventListener('input', function () {
        toggleRequired(supportTime2, this.value.trim());
    });

    const deploymentIdInput = document.getElementById('deploymentId');
    const sheetIdInput = document.getElementById('sheetId');
    const sheetGidInput = document.getElementById('sheetGid');
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const deploymentId = urlParams.get('deploymentId');
    const sheetId = urlParams.get('sheetId');
    const sheetGid = urlParams.get('sheetGid');
    const isDebugMode = urlParams.get('debug') === 'true';

    // クエリパラメータから値を設定
    if (deploymentId) deploymentIdInput.value = deploymentId;
    if (sheetId) sheetIdInput.value = sheetId;
    if (sheetGid) sheetGidInput.value = sheetGid;


    if (isDebugMode) {
        // デバッグモード時の初期値設定
        const debugData = {
            responsiblePerson: 'デバッグ担当者',
            userName: 'デバッグ利用者',
            contactDateTime: '2024-12-01T08:00',
            contactPerson: '本人',
            contactMethod: '電話',
            category: '欠席',
            reason: '体調不良',
            startDateTime: '2024-12-01T09:00',
            endDateTime: '2024-12-01T17:00',
            supportTime1: '08:00',
            supportAdvice1: '体調管理に注意するよう助言',
            supportTime2: '18:00',
            supportAdvice2: '次回の通院日を確認',
            currentSituation: '朝から微熱が続いている',
            nextVisitDate: '2024-12-02',
            additionalSupport: '有',
            lunchCancel: '無'
        };
        Object.entries(debugData).forEach(([key, value]) => {
            const element = document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'radio' || element.type === 'checkbox') {
                    element.checked = true;
                } else {
                    element.value = value;
                }
            }
        });
    }

    const form = document.getElementById('attendanceForm');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        const deploymentId = deploymentIdInput.value;
        const sheetId = sheetIdInput.value;
        const sheetGid = sheetGidInput.value;

        // 必須項目チェックを追加
        if (!validateForm(data, deploymentId, sheetId, sheetGid)) return;

        const url = `/exec?deploymentId=${encodeURIComponent(deploymentId)}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({...data, sheetId, sheetGid})
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTPエラー ${response.status}: ${response.statusText}\n${errorText}`);
            }

            const responseData = await response.json();
            if (responseData.result === 'success') {
                alert('データが送信されました！');
                form.reset();
            } else if (responseData.result === 'duplicate') {
                alert('重複送信が検出されました。');
            } else if (responseData.result === 'error') {
                alert(`エラーが発生しました: ${responseData.message}`);
            } else if (responseData.result === 'unauthorized') {
                alert('アクセスが許可されていません');
            } else {
                alert('予期せぬエラーが発生しました。');
            }

        } catch (error) {
            console.error('エラー:', error);
            alert(`データ送信中にエラーが発生しました: ${error.message}`);
        }
    });

    function toggleRequired(element, value) {
        element.required = value !== '';
    }

    function validateForm(data, deploymentId, sheetId, sheetGid) {
        if (!deploymentId.trim()) {
            alert('デプロイIDを入力してください。');
            return false;
        }
        if (!sheetId.trim()) {
            alert('スプレッドシートIDを入力してください。');
            return false;
        }
        if (!sheetGid.trim()) {
            alert('シートGIDを入力してください。');
            return false;
        }
        // 他の必須項目のバリデーションは、必要に応じて追加
        return true;
    }
});