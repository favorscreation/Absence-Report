document.addEventListener('DOMContentLoaded', function () {
    // 連絡者の選択に応じて表示するフィールドを切り替え
    var contactPerson = document.getElementById('contactPerson');
    if (contactPerson) {
        contactPerson.addEventListener('change', function() {
            var otherContactPerson = document.getElementById('otherContactPerson');
            if (this.value === 'その他') {
                otherContactPerson.style.display = 'block';
                otherContactPerson.required = true;
            } else {
                otherContactPerson.style.display = 'none';
                otherContactPerson.required = false;
            }
        });
    }

    // GASデプロイIDの設定
    const deploymentIdInput = document.getElementById('deploymentId');
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const deploymentId = urlParams.get('deploymentId');
    const isDebugMode = urlParams.get('debug') === 'true';

    if (deploymentId) {
        deploymentIdInput.value = deploymentId;
        deploymentIdInput.readOnly = true;
        deploymentIdInput.style.backgroundColor = '#e9e9e9';
        deploymentIdInput.style.color = '#a9a9a9';
        deploymentIdInput.style.pointerEvents = 'none';
    }

    const form = document.getElementById('attendanceForm');
    let isSubmitting = false;

    if (isDebugMode) {
        // デバッグモードならすべてのフィールドにデフォルト値を設定
        const fields = {
            responsiblePerson: 'デバッグ担当者',
            userName: 'デバッグ利用者',
            contactDateTime: '2024-12-01T08:00',
            contactPerson: '本人',
            contactMethod: '電話',
            category: '欠席',
            reason: '体調不良',
            startDateTime: '2024-12-01T09:00',
            endDateTime: '2024-12-01T17:00',
            startTime: '08:00',
            supportAdvice1: '体調管理に注意するよう助言',
            endTime: '18:00',
            supportAdvice2: '次回の通院日を確認',
            currentSituation: '朝から微熱が続いている',
            nextVisitDate: '2024-12-02',
            additionalSupport: '有',
            lunchCancel: '無'
        };

        for (let [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            } else {
                console.warn(`Element with ID ${id} not found`);
            }
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        data.deploymentId = deploymentId || deploymentIdInput.value;

        const url = `https://script.google.com/macros/s/${data.deploymentId}/exec`;

        fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            alert('データが送信されました！');
            isSubmitting = false; // 送信完了後にボタンを有効化
            form.reset(); // フォームをリセット
        }).catch(error => {
            console.error('エラー:', error);
            isSubmitting = false; // エラー発生時にボタンを有効化
        });
    });
});
