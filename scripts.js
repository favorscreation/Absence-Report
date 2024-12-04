let isSubmitting = false;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || 'user';
    const isDebugMode = urlParams.get('debug') === 'true';

    const spreadsheetId = urlParams.get('spreadsheetsID');
    const sheetIdentifier = urlParams.get('spreadsheetsGID');
    const deploymentId = urlParams.get('deploymentId');
    const identifierType = urlParams.get('sheetType') || 'gid';

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');


    if (!spreadsheetId || !sheetIdentifier || !deploymentId) {
        console.error("必要なクエリパラメータが不足しています。");
        alert("必要なクエリパラメータが不足しています。URLを確認してください。");
        return;
    }

    fetchSpreadsheetName(spreadsheetId, deploymentId);

    // 役割による表示制御
    if (role === 'staff') {
        document.querySelectorAll('.staff-only').forEach(el => el.style.display = 'block');
    } else {
        document.querySelectorAll('.staff-only').forEach(el => el.style.display = 'none');
    }

    // デバッグモード
    if (isDebugMode) {
        const debugFields = {
            userName: 'デバッグ利用者',
            contactDateTime: '2024-12-01T08:00',
            contactPerson: '本人',
            otherContactPerson: 'デバッグその他',
            contactMethod: '電話',
            category: '欠勤',
            reason: '体調不良',
            startDate: '2024-12-01',
            startTime: '09:00',
            endDate: '2024-12-01',
            endTime: '17:00',
            supportTime1: '08:00',
            supportAdvice1: '体調管理に注意するよう助言',
            supportTime2: '18:00',
            supportAdvice2: '次回の通院日を確認',
            currentSituation: '朝から微熱が続いている',
            nextVisitDate: '2024-12-02'
        };
        fillFormWithData(debugFields);
    }

    // イベントリスナー
    const contactPersonSelect = document.getElementById('contactPerson');
    contactPersonSelect.addEventListener('change', () =>
        toggleOtherContactPersonInput(contactPersonSelect.value === 'その他')
    );

    const form = document.getElementById('attendanceForm');
    form.addEventListener('submit', handleSubmit);

    const supportAdviceInputs = ['supportAdvice1', 'supportAdvice2'].map(id =>
        document.getElementById(id)
    );
    supportAdviceInputs.forEach((input, index) =>
        input.addEventListener('input', () =>
            toggleRequired(input, `supportTime${index + 1}`)
        )
    );

    // 欠勤の場合の時刻入力制御と日付入力欄のグレーアウト処理
    const categorySelect = document.getElementById('category');

    // ページ読み込み時にも一度実行する
    updateDateTimeFields();

    categorySelect.addEventListener('change', updateDateTimeFields);

    function updateDateTimeFields() {
        const isAbsence = categorySelect.value === '欠勤';
        startTimeInput.disabled = isAbsence;
        endTimeInput.disabled = isAbsence;
        startTimeInput.style.backgroundColor = isAbsence ? '#f2f2f2' : 'white';
        endTimeInput.style.backgroundColor = isAbsence ? '#f2f2f2' : 'white';

        // 欠勤の場合でも開始日と終了日は必須のままにする
        startDateInput.required = true;
        endDateInput.required = true;
        startDateInput.style.backgroundColor = 'white';
        endDateInput.style.backgroundColor = 'white';

        startTimeInput.required = !isAbsence;
        endTimeInput.required = !isAbsence;

        if (isAbsence) {
            startTimeInput.value = '';
            endTimeInput.value = '';
        }
    }

    // 関数定義
    function fetchSpreadsheetName(spreadsheetId, deploymentId) {
        const url = `https://script.google.com/macros/s/${deploymentId}/exec?spreadsheetId=${spreadsheetId}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.name) {
                    document.title = data.name;
                    document.querySelector('h1').textContent = data.name;
                } else {
                    console.error('スプレッドシートの名前を取得できませんでした。', data.error);
                }
            })
            .catch(error => console.error('エラーが発生しました。', error));
    }

    function toggleOtherContactPersonInput(show) {
        const otherContactPersonInput = document.getElementById('otherContactPerson');
        otherContactPersonInput.style.display = show ? 'block' : 'none';
        otherContactPersonInput.required = show;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (isSubmitting) return;

        if (!validateForm()) return;

        const formData = new FormData(form);
        const params = prepareRequestParams(formData);
        submitForm(params);
    }

    function validateForm() {
        const requiredFields = [
            'userName', 'contactDateTime', 'contactPerson', 'category', 'startDate', 'endDate', 'currentSituation'
        ];

        for (const fieldId of requiredFields) {
            const element = document.getElementById(fieldId);
            if (!element) {
                console.error(`ID "${fieldId}" の要素が見つかりません。`);
                return false;
            }
            if (element.value.trim() === "" && element.type !== 'radio') {
                alert(`${element.previousElementSibling.textContent.trim()}を入力してください。`);
                return false;
            }
            if (element.type === 'radio' && !element.checked) {
                // ラジオボタングループを見つけて、どれか選択されているか確認します。
                const radioGroup = element.closest('.radio-group');
                if (radioGroup && !Array.from(radioGroup.querySelectorAll('input[type="radio"]')).some(radio => radio.checked)) {
                    alert(`「${radioGroup.previousElementSibling.textContent.trim()}」を選択してください`);
                    return false;
                }
            }
        }

        // 連絡方法（ラジオボタン）のチェック
        const contactMethodRadios = document.querySelectorAll('input[name="contactMethod"]');
        if (!Array.from(contactMethodRadios).some(radio => radio.checked)) {
            alert('連絡方法を選択してください');
            return false;
        }

        // 事由（ラジオボタン）のチェックを追加
        const reasonRadios = document.querySelectorAll('input[name="reason"]');
        if (!Array.from(reasonRadios).some(radio => radio.checked)) {
            alert('事由を選択してください');
            return false;
        }


        const category = document.getElementById('category').value;
        if (category !== '欠勤') {
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            if (!startTime || !endTime) {
                alert('開始時刻と終了時刻を入力してください。');
                return false;
            }
        }

        // 相談支援・助言が入力されている場合、支援時刻も入力されているかチェック
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

    function prepareRequestParams(formData) {
        const params = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
            params.append(key, value);
        }

        // 開始日時と終了日時の結合。空欄の場合は空文字列を送信
        const startDate = document.getElementById('startDate').value;
        const startTime = document.getElementById('startTime').value || "";
        const endDate = document.getElementById('endDate').value;
        const endTime = document.getElementById('endTime').value || "";


        if (startDate) {
            params.append('startDateTime', `${startDate}T${startTime}`);
        }
        if (endDate) {
            params.append('endDateTime', `${endDate}T${endTime}`);
        }

        if (document.getElementById('contactPerson').value === 'その他') {
            params.set('contactPerson', document.getElementById('otherContactPerson').value);
        }
        params.append('spreadsheetsID', spreadsheetId);
        params.append('spreadsheetsGID', sheetIdentifier);
        params.append('sheetType', identifierType);
        return params;
    }

    function submitForm(params) {
        isSubmitting = true;
        toggleLoader(true);

        console.log('送信内容:', Object.fromEntries(params));
        const url = `https://script.google.com/macros/s/${deploymentId}/exec`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        })
            .then(response => response.json())
            .then(result => {
                alert('データが送信されました！');
                console.log(result);
                form.reset();
                toggleOtherContactPersonInput(false);
                updateDateTimeFields();
            })
            .catch(error => {
                console.error('送信エラーが発生しました。', error);
                alert('送信エラーが発生しました。');
            })
            .finally(() => {
                isSubmitting = false;
                toggleLoader(false);
            });
    }

    function toggleRequired(adviceInput, timeInputId) {
        const timeInput = document.getElementById(timeInputId);
        timeInput.required = adviceInput.value.trim() !== '';
    }

    function fillFormWithData(data) {
        for (const [id, value] of Object.entries(data)) {
            const element = document.querySelector(`[name="${id}"]`) || document.getElementById(id);
            if (!element) {
                console.warn(`nameまたはIDが "${id}" の要素が見つかりません`);
                continue;
            }
            if (element.type === "radio" || element.type === "checkbox") {
                element.checked = element.value === value;
            } else {
                element.value = value;
            }
        }
        if (document.getElementById('contactPerson').value === 'その他') {
            document.getElementById('otherContactPerson').style.display = 'block';
        }
    }

    function toggleLoader(show) {
        const loader = document.getElementById('loader');
        const submitButton = form.querySelector('button[type="submit"]');
        loader.style.display = show ? 'block' : 'none';
        submitButton.disabled = show;
    }

    document.getElementById('setNow').addEventListener('click', () => {
        const dateTimeInput = document.getElementById('contactDateTime');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        dateTimeInput.value = formattedDateTime;
    });
});