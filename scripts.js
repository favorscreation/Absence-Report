document.addEventListener('DOMContentLoaded', function () {
    // 連絡者の選択に応じて表示するフィールドを切り替え
    const contactPerson = document.getElementById('contactPerson');
    if (contactPerson) {
        contactPerson.addEventListener('change', function() {
            const otherContactPerson = document.getElementById('otherContactPerson');
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
    const submitButton = form.querySelector('button[type="submit"]');
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
            supportTime1: '08:00',
            supportAdvice1: '体調管理に注意するよう助言',
            supportTime2: '18:00',
            supportAdvice2: '次回の通院日を確認',
            currentSituation: '朝から微熱が続いている',
            nextVisitDate: '2024-12-02',
            additionalSupport: '有',
            lunchCancel: '無'
        };

        for (let [id, value] of Object.entries(fields)) {
            const element = document.querySelector(`[name="${id}"]`) || document.getElementById(id);
            if (element) {
                if (element.type === "radio" || element.type === "checkbox") {
                    element.checked = true;
                } else {
                    element.value = value;
                }
            } else {
                console.warn(`Element with name or ID ${id} not found`);
            }
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;
        submitButton.disabled = true;

        if (!validateForm()) {
            isSubmitting = false;
            submitButton.disabled = false;
            return;
        }

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
            isSubmitting = false;
            submitButton.disabled = false;
            form.reset();
        }).catch(error => {
            console.error('エラー:', error);
            isSubmitting = false;
            submitButton.disabled = false;
        });
    });


    // 相談支援・助言の入力に応じて支援時刻のrequired属性を動的に設定
    const supportAdvice1 = document.getElementById('supportAdvice1');
    const supportTime1 = document.getElementById('supportTime1');
    const supportAdvice2 = document.getElementById('supportAdvice2');
    const supportTime2 = document.getElementById('supportTime2');

    supportAdvice1.addEventListener('input', function() {
        toggleRequired(supportAdvice1, 'supportTime1');
    });

    supportAdvice2.addEventListener('input', function() {
        toggleRequired(supportAdvice2, 'supportTime2');
    });
});

function validateForm() {
    const supportAdvice1 = document.getElementById('supportAdvice1').value.trim();
    const supportTime1 = document.getElementById('supportTime1').value.trim();
    const supportAdvice2 = document.getElementById('supportAdvice2').value.trim();
    const supportTime2 = document.getElementById('supportTime2').value.trim();

    if (supportAdvice1 && !supportTime1) {
        alert('「相談支援・助言1」が入力されていますが、「支援時刻1」が入力されていません。');
        return false;
    }

    if (supportAdvice2 && !supportTime2) {
        alert('「相談支援・助言2」が入力されていますが、「支援時刻2」が入力されていません。');
        return false;
    }

    return true;
}

function toggleRequired(adviceInput, timeInputId) {
    const timeInput = document.getElementById(timeInputId);
    if (timeInput && typeof timeInput.removeAttribute === 'function') {
        if (adviceInput.value.trim() !== '') {
            timeInput.setAttribute('required', 'required');
        } else {
            timeInput.removeAttribute('required');
        }
    } else {
        console.error(`timeInput element with ID ${timeInputId} not found or not valid`);
    }
}