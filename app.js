document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const deviceModeSelect = document.getElementById('deviceMode');
    const cylinderVolumeInput = document.getElementById('cylinderVolume');
    const pressureInput = document.getElementById('pressure');
    const minuteVolumeInput = document.getElementById('minuteVolume');
    const floatTriggerInput = document.getElementById('floatTrigger');
    const leakMvInput = document.getElementById('leakMv');
    const o2FlowInput = document.getElementById('o2Flow');
    const totalFlowInput = document.getElementById('totalFlow');
    const fio2Input = document.getElementById('fio2');
    const dynamicInputs = document.querySelectorAll('.dynamic-input');

    // Outputs
    const safeTimeResult = document.getElementById('safeTimeResult');
    const remainingVolumeDetail = document.getElementById('remainingVolumeDetail');
    const consumptionDetail = document.getElementById('consumptionDetail');
    const calcTimeDetail = document.getElementById('calcTimeDetail');
    const resultSection = document.querySelector('.result-section');

    // Add event listeners to all inputs
    const inputs = [
        cylinderVolumeInput, pressureInput, minuteVolumeInput,
        floatTriggerInput, leakMvInput, o2FlowInput, totalFlowInput, fio2Input
    ];
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    deviceModeSelect.addEventListener('change', () => {
        updateInputVisibility();
        calculate();
    });

    function updateInputVisibility() {
        const mode = deviceModeSelect.value;
        const groupClass = `group-${mode}`;

        dynamicInputs.forEach(el => {
            if (el.classList.contains(groupClass)) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    function calculate() {
        // Get mode and base values
        const mode = deviceModeSelect.value;
        const vCyl = parseFloat(cylinderVolumeInput.value);
        const p = parseFloat(pressureInput.value);

        // Validation array
        let isValid = true;
        if (isNaN(vCyl) || isNaN(p) || vCyl <= 0 || p < 0) {
            isValid = false;
        }

        // 1. Oxygen Cylinder Remaining Volume (L)
        const vRem = vCyl * p * 10;
        let flowO2 = 0;

        // Mode-specific calculations
        if (mode === 'ippv' || mode === 'nppv') {
            const mv = parseFloat(minuteVolumeInput.value);
            const ft = parseFloat(floatTriggerInput.value) || 0;
            const fio2 = parseFloat(fio2Input.value);
            const leak = mode === 'nppv' ? (parseFloat(leakMvInput.value) || 0) : 0;

            if (isNaN(mv) || isNaN(fio2) || mv <= 0 || fio2 < 21 || fio2 > 100 || ft < 0 || leak < 0) isValid = false;

            if (isValid && fio2 > 21) {
                // Flow_O2 = (MV + FT + Leak) * ((FiO2 - 21) / 79)
                flowO2 = (mv + ft + leak) * ((fio2 - 21) / 79);
            }
        } else if (mode === 'o2_therapy') {
            const o2f = parseFloat(o2FlowInput.value);
            if (isNaN(o2f) || o2f <= 0) isValid = false;

            if (isValid) {
                flowO2 = o2f;
            }
        } else if (mode === 'nhf') {
            const tf = parseFloat(totalFlowInput.value);
            const fio2 = parseFloat(fio2Input.value);

            if (isNaN(tf) || isNaN(fio2) || tf <= 0 || fio2 < 21 || fio2 > 100) isValid = false;

            if (isValid && fio2 > 21) {
                // Flow_O2 = TotalFlow * ((FiO2 - 21) / 79)
                flowO2 = tf * ((fio2 - 21) / 79);
            }
        }

        if (!isValid) {
            resetDisplay();
            return;
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

    // Initialize UI on load
    updateInputVisibility();

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
