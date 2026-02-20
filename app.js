document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const cylinderVolumeInput = document.getElementById('cylinderVolume');
    const pressureInput = document.getElementById('pressure');
    const minuteVolumeInput = document.getElementById('minuteVolume');
    const fio2Input = document.getElementById('fio2');

    // Outputs
    const safeTimeResult = document.getElementById('safeTimeResult');
    const remainingVolumeDetail = document.getElementById('remainingVolumeDetail');
    const consumptionDetail = document.getElementById('consumptionDetail');
    const calcTimeDetail = document.getElementById('calcTimeDetail');
    const resultSection = document.querySelector('.result-section');

    // Add event listeners to all inputs
    const inputs = [cylinderVolumeInput, pressureInput, minuteVolumeInput, fio2Input];
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    function calculate() {
        // Get values
        const vCyl = parseFloat(cylinderVolumeInput.value);
        const p = parseFloat(pressureInput.value);
        const mv = parseFloat(minuteVolumeInput.value);
        const fio2 = parseFloat(fio2Input.value);

        // Validate values
        if (isNaN(vCyl) || isNaN(p) || isNaN(mv) || isNaN(fio2) ||
            vCyl <= 0 || p < 0 || mv <= 0 || fio2 < 21 || fio2 > 100) {
            resetDisplay();
            return;
        }

        // 1. Oxygen Cylinder Remaining Volume (L) = 容器の内容積(L) × 圧力計の数値(MPa) × 10
        const vRem = vCyl * p * 10;

        // 2. Ventilator Oxygen Consumption (L/min) = 分時換気量 × ((酸素濃度(%) - 21) / 79)
        let flowO2 = 0;
        if (fio2 > 21) {
            flowO2 = mv * ((fio2 - 21) / 79);
        }

        let tCalc = Infinity;
        let tSafe = Infinity;

        if (flowO2 > 0) {
            // 3. Available Duration (min) = 残量(L) / 流量(L/分)
            tCalc = vRem / flowO2;

            // 4. Safe Duration (min) = 使用可能時間(分) * 0.8
            tSafe = tCalc * 0.8;
        }

        // Update UI
        updateDisplay(vRem, flowO2, tCalc, tSafe);
    }

    function updateDisplay(vRem, flowO2, tCalc, tSafe) {
        remainingVolumeDetail.textContent = `${vRem.toFixed(1)} L`;
        consumptionDetail.textContent = `${flowO2.toFixed(2)} L/分`;

        if (!isFinite(tCalc)) {
            calcTimeDetail.textContent = '無限大 (酸素消費なし)';
            safeTimeResult.textContent = '∞';
        } else {
            calcTimeDetail.textContent = `${Math.floor(tCalc)} 分`;
            safeTimeResult.textContent = Math.floor(tSafe).toString();
        }

        // Add a subtle animation to indicate update
        resultSection.classList.remove('updated');
        void resultSection.offsetWidth; // Trigger reflow
        resultSection.classList.add('updated');
    }

    function resetDisplay() {
        safeTimeResult.textContent = '--';
        remainingVolumeDetail.textContent = '-- L';
        consumptionDetail.textContent = '-- L/分';
        calcTimeDetail.textContent = '-- 分';
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});
