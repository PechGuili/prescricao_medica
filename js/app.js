// VARIÁVEIS GLOBAIS
let formulaCount = 2;
let actionHistory = [];
let removedFormulas = [];

// MAPEAMENTO DE FÓRMULAS PARA CRONOGRAMA
const formulaSchedule = {
    1: { time: '8h00\n(manhã)', medication: '• 1 dose Fórmula Imuno-respiratória', observation: 'Com café da manhã' },
    2: { time: '21h00\n(noite)', medication: '• 1 sachê Fórmula Sono e Relaxamento', observation: '1-2h antes de dormir, dissolver em 200ml água' }
};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    syncDoctorData();
    updateSchedule();
    updateHistoryCounter();
    checkEmptyPages();
});

// FUNÇÃO PARA ADICIONAR NOVA FÓRMULA
function addFormula() {
    formulaCount++;
    
    const action = {
        type: 'add',
        formulaId: formulaCount,
        timestamp: Date.now()
    };
    
    const newFormulaHTML = createFormulaHTML(formulaCount);
    
    // Adicionar na página atual
    const currentContainer = document.querySelector('.formulas-container');
    currentContainer.insertAdjacentHTML('beforeend', newFormulaHTML);
    
    // Adicionar ao cronograma
    addScheduleRow(formulaCount);
    
    // Salvar ação no histórico
    actionHistory.push(action);
    updateHistoryCounter();
    
    // Sincronizar dados
    syncDoctorData();
    
    // Verificar páginas vazias
    checkEmptyPages();
}

// FUNÇÃO PARA REMOVER FÓRMULA
function removeFormula(formulaId) {
    const formula = document.querySelector(`[data-formula-id="${formulaId}"]`);
    if (!formula) return;
    
    // Salvar dados da fórmula antes de remover
    const formulaData = {
        id: formulaId,
        html: formula.outerHTML,
        scheduleData: formulaSchedule[formulaId] || null
    };
    
    // Remover do DOM
    formula.remove();
    
    // Remover do cronograma
    removeScheduleRow(formulaId);
    
    // Salvar ação no histórico
    const action = {
        type: 'remove',
        formulaId: formulaId,
        formulaData: formulaData,
        timestamp: Date.now()
    };
    
    actionHistory.push(action);
    removedFormulas.push(formulaData);
    updateHistoryCounter();
    
    // Verificar páginas vazias
    checkEmptyPages();
}

// FUNÇÃO PARA DESFAZER ÚLTIMA AÇÃO
function undoLastAction() {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory.pop();
    
    switch(lastAction.type) {
        case 'add':
            // Remover a fórmula adicionada
            const addedFormula = document.querySelector(`[data-formula-id="${lastAction.formulaId}"]`);
            if (addedFormula) {
                addedFormula.remove();
                removeScheduleRow(lastAction.formulaId);
            }
            formulaCount--;
            break;
            
        case 'remove':
            // Restaurar a fórmula removida
            restoreFormula(lastAction.formulaData);
            break;
    }
    
    updateHistoryCounter();
    checkEmptyPages();
}

// FUNÇÃO PARA RESTAURAR FÓRMULA REMOVIDA
function restoreFormula(formulaData) {
    // Encontrar o lugar correto para inserir
    const allFormulas = document.querySelectorAll('.formula-section');
    let insertBefore = null;
    
    for (let formula of allFormulas) {
        const id = parseInt(formula.getAttribute('data-formula-id'));
        if (id > formulaData.id) {
            insertBefore = formula;
            break;
        }
    }
    
    // Inserir no DOM
    const container = document.querySelector('.formulas-container');
    if (insertBefore) {
        insertBefore.insertAdjacentHTML('beforebegin', formulaData.html);
    } else {
        container.insertAdjacentHTML('beforeend', formulaData.html);
    }
    
    // Restaurar no cronograma
    if (formulaData.scheduleData) {
        formulaSchedule[formulaData.id] = formulaData.scheduleData;
        updateSchedule();
    }
}

// FUNÇÃO PARA VERIFICAR PÁGINAS VAZIAS
function checkEmptyPages() {
    const pages = document.querySelectorAll('.page');
    
    pages.forEach(page => {
        const hasFormulas = page.querySelector('.formula-section');
        const hasSchedule = page.querySelector('.schedule-table');
        const hasSignature = page.querySelector('.signature-section-highlight');
        const hasWarnings = page.querySelector('.warnings');
        
        // Se a página tem apenas cabeçalho e rodapé, marcar como vazia
        if (!hasFormulas && !hasSchedule && !hasSignature && !hasWarnings) {
            page.classList.add('empty');
        } else {
            page.classList.remove('empty');
        }
    });
}

// CRIAR HTML DE NOVA FÓRMULA
function createFormulaHTML(number) {
    return `
        <div class="formula-section" data-formula-id="${number}">
            <button class="remove-formula-btn" onclick="removeFormula(${number})" title="Remover esta fórmula">
                ❌
            </button>
            <div class="formula-header">
                <input type="text" value="${number}️⃣ NOVA FÓRMULA" placeholder="Nome da fórmula">
            </div>
            <div class="formula-content">
                <div class="medication-item">
                    <input type="text" class="medication-name" value="Manipular em comprimidos:" placeholder="Tipo de manipulação">
                    <textarea class="medication-composition" placeholder="Digite a composição da fórmula">• Ativo principal .......................... 250mg
• Ativo secundário ................... 100mg
• Excipiente qsp ....................... 1 comprimido</textarea>
                    <div class="medication-instructions">
                        <input type="text" class="posology" value="Posologia: 1 dose por dia conforme orientação médica" placeholder="Posologia">
                        <input type="text" class="duration" value="Duração: Uso contínuo - Manipular para 1 mês" placeholder="Duração do tratamento">
                        <input type="text" class="notes" value="Tomar preferencialmente com refeições" placeholder="Observações">
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ATUALIZAR CRONOGRAMA
function updateSchedule() {
    const scheduleTableBody = document.getElementById('scheduleTableBody');
    scheduleTableBody.innerHTML = '';
    
    // Ordenar por horário
    const sortedSchedule = Object.entries(formulaSchedule)
        .filter(([id]) => document.querySelector(`[data-formula-id="${id}"]`))
        .sort((a, b) => {
            const timeA = parseInt(a[1].time.match(/\d+/)[0]);
            const timeB = parseInt(b[1].time.match(/\d+/)[0]);
            return timeA - timeB;
        });
    
    // Adicionar linhas
    sortedSchedule.forEach(([id, data]) => {
        const rowHTML = `
            <tr data-schedule-id="${id}">
                <td><textarea>${data.time}</textarea></td>
                <td><textarea>${data.medication}</textarea></td>
                <td><textarea>${data.observation}</textarea></td>
            </tr>
        `;
        scheduleTableBody.insertAdjacentHTML('beforeend', rowHTML);
    });
}

// ADICIONAR LINHA AO CRONOGRAMA
function addScheduleRow(formulaNumber) {
    const timeSlots = ['9h00', '10h00', '11h00', '14h00', '15h00', '16h00', '17h00', '18h00', '20h00', '22h00'];
    const timeIndex = formulaNumber - 3;
    
    formulaSchedule[formulaNumber] = {
        time: `${timeSlots[timeIndex] || (8 + timeIndex) + 'h00'}\n(horário)`,
        medication: `• 1 dose ${formulaNumber}ª Fórmula`,
        observation: 'Conforme orientação médica'
    };
    
    updateSchedule();
}

// REMOVER LINHA DO CRONOGRAMA
function removeScheduleRow(formulaId) {
    delete formulaSchedule[formulaId];
    updateSchedule();
}

// SINCRONIZAR DADOS DO MÉDICO
function syncDoctorData() {
    const doctorInputs = document.querySelectorAll('.doctor-name, .specialty, .credentials');
    
    doctorInputs.forEach((input) => {
        input.addEventListener('input', function() {
            const className = this.className;
            const allSimilar = document.querySelectorAll('.' + className);
            
            allSimilar.forEach(similarInput => {
                if (similarInput !== this) {
                    similarInput.value = this.value;
                }
            });
        });
    });
}

// ATUALIZAR CONTADOR DE HISTÓRICO
function updateHistoryCounter() {
    const counter = document.getElementById('historyCounter');
    counter.textContent = `${actionHistory.length} ações`;
    
    const undoBtn = document.querySelector('.undo-btn');
    undoBtn.disabled = actionHistory.length === 0;
}

// SALVAR ESTADO AUTOMATICAMENTE
function saveState() {
    const state = {
        formulaCount: formulaCount,
        actionHistory: actionHistory,
        removedFormulas: removedFormulas,
        formulaSchedule: formulaSchedule,
        pageContent: document.documentElement.innerHTML
    };
    
    localStorage.setItem('prescriptionState', JSON.stringify(state));
}

// RESTAURAR ESTADO
function restoreState() {
    const savedState = localStorage.getItem('prescriptionState');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Implementar restauração se necessário
    }
}

// AUTO-SAVE A CADA MUDANÇA
document.addEventListener('input', function(e) {
    if (e.target.matches('input, textarea')) {
        setTimeout(saveState, 500);
    }
});

// FUNÇÃO ESPECIAL PARA IMPRESSÃO
window.addEventListener('beforeprint', function() {
    checkEmptyPages();
});
