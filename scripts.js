document.addEventListener('DOMContentLoaded', function() {
    // 連絡者の選択に応じて表示するフィールドを切り替え
    const contactPersonSelect = document.getElementById('contactPerson');
    const otherContactPersonInput = document.getElementById('otherContactPerson');

    contactPersonSelect.addEventListener('change', () => {
        otherContactPersonInput.style.display = contactPersonSelect.value === 'その他' ? 'block' : 'none';
    });

    // 事由の選択に応じて表示するフィールドを切り替え
    const reasonSelect = document.getElementById('reason');
    const otherReasonInput = document.getElementById('otherReason');

    reasonSelect.addEventListener('change', () => {
        otherReasonInput.style.display = reasonSelect.value === 'その他' ? 'block' : 'none';
    });

    // 相談支援・助言の入力に応じて支援時刻のrequired属性を動的に設定
    const supportAdviceElements = [
        { advice: document.getElementById('supportAdvice1'), time: document.getElementById('supportTime1') },
        { advice: document.getElementById('supportAdvice2'), time: document.getElementById('supportTime2') }
    ];

    supportAdviceElements.forEach(element => {
        element.advice.addEventListener('input', function() {
            toggleRequired(this, element.time);
        });
    });
});


function toggleRequired(adviceInput, timeInput) {
    if (timeInput) {
        timeInput.required = adviceInput.value.trim() !== '';
    } else {
        console.error('Time input element not found.');
    }
}