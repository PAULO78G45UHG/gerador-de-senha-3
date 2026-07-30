document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const output = document.getElementById('passwordOutput');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const refreshBtn = document.getElementById('refreshBtn');

  const lengthRange = document.getElementById('lengthRange');
  const lengthNumber = document.getElementById('lengthNumber');

  const incUppercase = document.getElementById('incUppercase');
  const incLowercase = document.getElementById('incLowercase');
  const incNumbers = document.getElementById('incNumbers');
  const incSymbols = document.getElementById('incSymbols');
  const excludeAmbiguous = document.getElementById('excludeAmbiguous');

  const entropyValue = document.getElementById('entropyValue');
  const crackTimeValue = document.getElementById('crackTimeValue');
  const strengthScore = document.getElementById('strengthScore');
  const meterBar = document.getElementById('meterBar');

  // Conjuntos de Caracteres
  const SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const AMBIGUOUS_CHARS = /[il1Lo0O]/g;

  // Sincronização dos Inputs de Comprimento
  lengthRange.addEventListener('input', (e) => syncLength(e.target.value));
  lengthNumber.addEventListener('input', (e) => syncLength(e.target.value));

  function syncLength(val) {
    let cleanVal = Math.max(8, Math.min(128, val || 8));
    lengthRange.value = cleanVal;
    lengthNumber.value = cleanVal;
    generate();
  }

  // Obter Caractere Criptograficamente Seguro
  function getSecureRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }

  // Gerador Core
  function generate() {
    let pool = '';
    let required = [];

    if (incUppercase.checked) {
      let set = SETS.uppercase;
      if (excludeAmbiguous.checked) set = set.replace(AMBIGUOUS_CHARS, '');
      pool += set;
      if (set) required.push(set[getSecureRandomInt(set.length)]);
    }

    if (incLowercase.checked) {
      let set = SETS.lowercase;
      if (excludeAmbiguous.checked) set = set.replace(AMBIGUOUS_CHARS, '');
      pool += set;
      if (set) required.push(set[getSecureRandomInt(set.length)]);
    }

    if (incNumbers.checked) {
      let set = SETS.numbers;
      if (excludeAmbiguous.checked) set = set.replace(AMBIGUOUS_CHARS, '');
      pool += set;
      if (set) required.push(set[getSecureRandomInt(set.length)]);
    }

    if (incSymbols.checked) {
      let set = SETS.symbols;
      pool += set;
      if (set) required.push(set[getSecureRandomInt(set.length)]);
    }

    if (!pool) {
      output.value = '';
      updateMetrics(0, 0);
      return;
    }

    const targetLength = parseInt(lengthRange.value, 10);
    let result = [...required];

    for (let i = result.length; i < targetLength; i++) {
      result.push(pool[getSecureRandomInt(pool.length)]);
    }

    // Embaralhamento Seguro (Fisher-Yates)
    for (let i = result.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    const password = result.join('');
    output.value = password;
    
    // Análise Matemática da Senha
    analyzeSecurity(password, pool.length);
  }

  // Análise de Entropia (E = L * log2(R))
  function analyzeSecurity(password, poolSize) {
    if (!password || poolSize === 0) return;

    const entropy = Math.round(password.length * Math.log2(poolSize));
    
    // Estimativa de tempo para quebra (supondo 100 bilhões de tentativas/seg - Nível Supercomputador)
    const combinations = Math.pow(poolSize, password.length);
    const seconds = combinations / 1e11; 

    updateMetrics(entropy, seconds);
  }

  function updateMetrics(entropy, seconds) {
    entropyValue.textContent = `${entropy} bits`;
    crackTimeValue.textContent = formatTime(seconds);

    // Avaliação de níveis com base nos padrões da NCSC e NIST
    let scoreText = 'Crítica';
    let color = 'var(--color-danger)';
    let percent = 20;

    if (entropy >= 128) {
      scoreText = 'Grau Militar / Ultra';
      color = 'var(--color-ultra)';
      percent = 100;
    } else if (entropy >= 80) {
      scoreText = 'Forte (Excelente)';
      color = 'var(--color-success)';
      percent = 80;
    } else if (entropy >= 60) {
      scoreText = 'Boa';
      color = 'var(--color-warning)';
      percent = 60;
    } else if (entropy >= 40) {
      scoreText = 'Moderada';
      color = 'var(--color-warning)';
      percent = 40;
    }

    strengthScore.textContent = scoreText;
    strengthScore.style.color = color;
    meterBar.style.width = `${percent}%`;
    meterBar.style.backgroundColor = color;
  }

  function formatTime(seconds) {
    if (seconds < 1) return 'Instantâneo';
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} horas`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} dias`;
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} anos`;
    return 'Centenas de Séculos';
  }

  // Copiar para Área de Transferência
  copyBtn.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      copyBtnText.textContent = 'Copiado!';
      setTimeout(() => copyBtnText.textContent = 'Copiar Senha', 2000);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  });

  // Eventos de teclado (Atalho: Pressionar Espaço gera nova senha)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      generate();
    }
  });

  // Listeners de mudança nas configurações
  [incUppercase, incLowercase, incNumbers, incSymbols, excludeAmbiguous].forEach(el => {
    el.addEventListener('change', generate);
  });

  refreshBtn.addEventListener('click', generate);

  // Inicializar
  generate();
});