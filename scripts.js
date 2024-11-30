document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'user'; // role パラメータを取得。デフォルトは 'user'
    const isDebugMode = params.get('debug') === 'true';

    const spreadsheetId = params.get('spreadsheetsID');
    const sheetIdentifier = params.get('spreadsheetsGID');
    const deploymentId = params.get('deploymentId');
    const identifierType = params.get('sheetType') || 'gid';

    if (!spreadsheetId || !sheetIdentifier || !deploymentId) {
        console.error("必要なクエリパラメータが不足しています。");
        alert("必要なクエリパラメータが不足しています。URLを確認してください。");
        return;
    }

    fetchSpreadsheetName(spreadsheetId, deploymentId);

    function fetchSpreadsheetName(spreadsheetId, deploymentId) {
        const url = `https://script.google.com/macros/s/${deploymentId}/exec?spreadsheetId=${spreadsheetId}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.name) {
                    document.title = data.name;
                    const titleElement = document.querySelector('h1');
                    if (titleElement) {
                        titleElement.textContent = data.name;
                    }
                } else {
                    console.error('スプレッドシートの名前を取得できませんでした。', data.error);
                }
            })
            .catch(error => console.error('エラーが発生しました。', error));
    }

    // 役割ごとに表示項目を変える
    if (role === 'staff') {
        document.querySelectorAll('.user-only').forEach(el => el.style.display = 'block');
    } else {
        document.querySelectorAll('.staff-only').forEach(el => el.style.display = 'none');
        // userロールの場合のみ必須に設定
        document.querySelectorAll('.user-only input, .user-only select, .user-only textarea').forEach(el => {
            if (el.id !== 'otherContactPerson') {
                el.required = true;
            }
        });
    }

    if (isDebugMode) {
        const fields = {
            responsiblePerson: 'デバッグ担当者',
            userName: 'デバッグ利用者',
            contactDateTime: '2024-12-01T08:00',
            contactPerson: '本人',
            otherContactPerson: 'デバッグその他',
            contactMethod: '電話',
            category: '欠勤',
            reason: '体調不良',
            startDateTime: '2024-12-01T09:00',
            endDateTime: '2024-12-01T17:00',
            supportTime1: '08:00',
            supportAdvice1: '体調管理に注意するよう助言',
            supportTime2: '18:00',
            supportAdvice2: '次回の通院日を確認',
            currentSituation: '朝から微熱が続いている',
            nextVisitDate: '2024-12-02'
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

        const contactPersonElement = document.getElementById('contactPerson');
        const otherContactPersonElement = document.getElementById('otherContactPerson');
        if (contactPersonElement.value === 'その他') {
            otherContactPersonElement.style.display = 'block';
        }
    }

    const contactPerson = document.getElementById('contactPerson');
    if (contactPerson) {
        contactPerson.addEventListener('change', function () {
            const otherContactPerson = document.getElementById('otherContactPerson');
            if (this.value === 'その他') {
                otherContactPerson.style.display = 'block';
                otherContactPerson.setAttribute('required', 'required');
            } else {
                otherContactPerson.style.display = 'none';
                otherContactPerson.removeAttribute('required');
            }
        });
    }

    const form = document.getElementById('attendanceForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const loader = document.getElementById('loader');
    let isSubmitting = false;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;
        submitButton.disabled = true;
        loader.style.display = 'block';

        if (!validateForm()) {
            isSubmitting = false;
            submitButton.disabled = false;
            loader.style.display = 'none';
            return;
        }

        const formData = new FormData(form);
        const params = new URLSearchParams();

        formData.forEach((value, key) => {
            const inputElement = document.querySelector(`[name="${key}"]`);
            if ((inputElement && inputElement.closest('.staff-only') && inputElement.closest('.staff-only').style.display !== 'none') || 
                (inputElement && inputElement.closest('.user-only') && inputElement.closest('.user-only').style.display !== 'none') || 
                (inputElement && !inputElement.closest('.staff-only') && !inputElement.closest('.user-only'))) {
                params.append(key, value);
            }
        });

        if (document.getElementById('contactPerson').value === 'その他') {
            const otherContactValue = document.getElementById('otherContactPerson').value;
            params.set('contactPerson', otherContactValue);
        }

        params.append('spreadsheetsID', spreadsheetId);
        params.append('spreadsheetsGID', sheetIdentifier);
        params.append('sheetType', identifierType);

        console.log('送信内容:', Object.fromEntries(params)); // 送信内容をコンソールに出力

        const url = `https://script.google.com/macros/s/${deploymentId}/exec`;

        const requestParams = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        };

        fetch(url, requestParams)
            .then((response) => response.json())
            .then((result) => {
                alert('データが送信されました！');
                console.log(result);
                form.reset();
                isSubmitting = false;
                submitButton.disabled = false;
                loader.style.display = 'none';
            })
            .catch((e) => {
                console.error('送信エラーが発生しました。', e);
                alert('送信エラーが発生しました。');
                isSubmitting = false;
                submitButton.disabled = false;
                loader.style.display = 'none';
            });
    });

    const supportAdviceInputs = [
        document.getElementById('supportAdvice1'),
        document.getElementById('supportAdvice2')
    ];
    const supportTimeInputIds = ['supportTime1', 'supportTime2'];

    supportAdviceInputs.forEach((adviceInput, index) => {
        if (adviceInput) {
            adviceInput.addEventListener('input', function () {
                toggleRequired(this, supportTimeInputIds[index]);
            });
        }
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
        if (timeInput) {
            if (adviceInput.value.trim() !== '') {
                timeInput.setAttribute('required', 'required');
            } else {
                timeInput.removeAttribute('required');
            }
        } else {
            console.error(`timeInput element with ID ${timeInputId} not found or not valid`);
        }
    }
});
