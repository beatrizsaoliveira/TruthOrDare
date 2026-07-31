import { readFileSync, writeFileSync } from 'node:fs';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseShots(cell) {
  cell = cell.trim();
  if (cell === '—' || cell === '-' || cell === '') return null;
  const m = cell.match(/🍺\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
function normalize(t) {
  return t
    .replace(/['\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
function hasTarget(text) {
  return /\[Target Player\]/i.test(text);
}
function parseRounds(text) {
  const m = text.match(/(?:durante|próximas?)\s+(\d+)\s+(?:rounds?|rondas?)/i);
  if (m) return { hasRounds: true, roundsCount: parseInt(m[1], 10) };
  return { hasRounds: false, roundsCount: null };
}
function extractTimerSeconds(rawText, type) {
  if (type !== 'dare') return null;
  if (/ronda|round/i.test(rawText)) return null;
  let m = rawText.match(/durante\s+(\d+)\s+segundos/i);
  if (m && m[1]) return parseInt(m[1], 10);
  m = rawText.match(/durante\s+(\d+)\s+minuto/i);
  if (m && m[1]) return parseInt(m[1], 10) * 60;
  m = rawText.match(/(\d+)\s+segundos/i);
  if (m && m[1]) return parseInt(m[1], 10);
  m = rawText.match(/(\d+)\s+minuto/i);
  if (m && m[1]) return parseInt(m[1], 10) * 60;
  return null;
}

// ─── pt-PT safe fixes (only clear typos, not dialect changes) ─────────────────
const SAFE_FIXES = {
  'parents a fazer': 'pais a fazer',
};

function applyPtFixes(text) {
  let fixed = text;
  for (const [wrong, right] of Object.entries(SAFE_FIXES)) {
    fixed = fixed.replace(new RegExp(wrong, 'gi'), right);
  }
  return fixed;
}

// ─── Exact text replacements for cards that reference another player ──────────
const TEXT_FIXES = {
  'Deixa alguém da roda desenhar-te um bigode com marcador lavável.':
    'Deixa [Target Player] desenhar-te um bigode com marcador lavável.',
  'Deixa alguém fazer-te cócegas durante 10 segundos sem te poderes rir.':
    'Deixa [Target Player] fazer-te cócegas durante 10 segundos sem te poderes rir.',
  'Deixa alguém desenhar-te orelhas de coelho com marcador lavável.':
    'Deixa [Target Player] desenhar-te orelhas de coelho com marcador lavável.',
  'Desafia alguém para um jogo do sério (quem rir primeiro perde).':
    'Desafia [Target Player] para um jogo do sério (quem rir primeiro perde).',
  'Faz push-ups com alguém sentado nas tuas costas.':
    'Faz push-ups com [Target Player] sentado nas tuas costas.',
  'Deixa alguém do grupo dar-te um corte de cabelo simbólico.':
    'Deixa [Target Player] dar-te um corte de cabelo simbólico.',
  'Dá o teu telemóvel desbloqueado à pessoa à esquerda por 1 minuto.':
    'Dá o teu telemóvel desbloqueado a [Target Player] por 1 minuto.',
  'Deixa alguém escrever-te uma palavra na testa com marcador (ou batom).':
    'Deixa [Target Player] escrever-te uma palavra na testa com marcador (ou batom).',
  'Faz flexões com alguém sentado nas tuas costas.':
    'Faz flexões com [Target Player] sentado nas tuas costas.',
  'Deixa alguém do grupo escolher uma peça de roupa para tirares.':
    'Deixa [Target Player] escolher uma peça de roupa para tirares.',
  'Faz um beijo a três com dois jogadores.':
    'Faz um beijo a três com [Target Player] e outro jogador.',
  'Bebe um shot completo pelo corpo de alguém.':
    'Bebe um shot completo pelo corpo de [Target Player].',
  'Desaperta e aperta os calçados de alguém usando apenas uma mão e a boca.':
    'Desaperta e aperta os calçados de [Target Player] usando apenas uma mão e a boca.',
  'Faz uma lap dance de 30 segundos ao jogador à tua frente.':
    'Faz uma lap dance de 30 segundos para [Target Player].',
  'Senta-te no chão, abraça as pernas de alguém e pede-lhe por amor de forma dramática.':
    'Senta-te no chão, abraça as pernas de [Target Player] e pede-lhe por amor de forma dramática.',
  'Deixa que alguém passe um cubo de gelo nos teus lábios e pescoço.':
    'Deixa que [Target Player] passe um cubo de gelo nos teus lábios e pescoço.',
  'Sussurra ao ouvido da pessoa mais velha do grupo o que lhe farias se estivessem sozinhos.':
    'Sussurra ao ouvido de [Target Player] o que lhe farias se estivessem sozinhos.',
  'Massa as coxas do jogador à tua escolha durante 1 minuto.':
    'Massa as coxas de [Target Player] durante 1 minuto.',
  'Pinta os lábios de batom e deixa uma marca de beijo na face de alguém.':
    'Pinta os lábios de batom e deixa uma marca de beijo na face de [Target Player].',
  'Pede a alguém para te dar palmadas leves enquanto contas até 10.':
    'Pede a [Target Player] para te dar palmadas leves enquanto contas até 10.',
  'Fica no colo do jogador da tua escolha até à próxima ronda.':
    'Fica no colo de [Target Player] até à próxima ronda.',
  'Usa a língua para desenhar um coração no braço ou na mão de alguém.':
    'Usa a língua para desenhar um coração no braço ou na mão de [Target Player].',
  'Tira as meias de alguém com os dentes.': 'Tira as meias de [Target Player] com os dentes.',
  'Cheira a roupa interior (limpa, se possível) por cima das calças do jogador à esquerda.':
    'Cheira a roupa interior de [Target Player] (limpa, se possível) por cima das calças.',
  'Beija apaixonadamente e com língua a pessoa do mesmo género mais próxima de ti na roda.':
    'Beija apaixonadamente e com língua [Target Player].',
  'Permite que o jogador à tua frente te dê 3 palmadas nas nádegas o mais forte que conseguir.':
    'Permite que [Target Player] te dê 3 palmadas nas nádegas o mais forte que conseguir.',
  'Senta-te em cima da cara (por cima da roupa) do jogador à tua escolha durante 30 segundos.':
    'Senta-te em cima da cara de [Target Player] (por cima da roupa) durante 30 segundos.',
  'Lambe a ponta dos dedos de alguém de forma muito lenta e sugestiva.':
    'Lambe a ponta dos dedos de [Target Player] de forma muito lenta e sugestiva.',
  'Deita uma bebida no umbigo ou zona abdominal de alguém e bebe sem usar as mãos.':
    'Deita uma bebida no umbigo ou zona abdominal de [Target Player] e bebe sem usar as mãos.',
  'Muda a tua roupa interior com outra pessoa do grupo.':
    'Muda a tua roupa interior com [Target Player].',
  'Usa gelo (ou cera morna) na zona pélvica de alguém por cima da roupa.':
    'Usa gelo (ou cera morna) na zona pélvica de [Target Player] por cima da roupa.',
  'Vai para o centro da roda de quatro e rasteja até ao colo de alguém.':
    'Vai para o centro da roda de quatro e rasteja até ao colo de [Target Player].',
  'Faz sexo com duas pessoas ao mesmo tempo.':
    'Faz sexo com [Target Player] e outra pessoa ao mesmo tempo.',
  'Deixa dois jogadores tocarem-te ao mesmo tempo.':
    'Deixa [Target Player] e outro jogador tocarem-te ao mesmo tempo.',
  'Bebe um shot e faz uma confissão sobre alguém da roda.':
    'Bebe um shot e faz uma confissão sobre [Target Player].',
};

// Regex fixes for remaining directional refs
const REGEX_FIXES = [
  {
    regex: /\b(pessoa|jogador|jogadora)\s+à\s+(tua\s+)?(esquerda|direita|frente)\b/gi,
    replacement: '[Target Player]',
  },
];

function fixText(text) {
  if (TEXT_FIXES[text]) return TEXT_FIXES[text];
  let fixed = text;
  for (const { regex, replacement } of REGEX_FIXES) fixed = fixed.replace(regex, replacement);
  return applyPtFixes(fixed);
}

// ─── Replacement cards ────────────────────────────────────────────────────────
function getReplacements(tier, type, count) {
  const all = {
    '2|truth': [
      ['Já te arrependeste de ter dado like numa foto antiga de alguém?', 1],
      ['Qual foi a coisa mais ridícula que já compraste online?', 1],
      ['Já fingiste que sabias o que era uma sigla e depois tiveste de pesquisar?', 1],
      ['Qual foi a maior confusão que fizeste com datas de aniversário?', 2],
      ['Já saíste com alguém só porque os amigos insistiram? Como correu?', 2],
      ['Qual é o teu vício secreto que nunca revelaste ao grupo?', 2],
      ['Já guardaste um áudio de alguém para mostrar aos amigos?', 2],
    ],
    '2|dare': [
      ['Liga a um contacto aleatório e diz "perdeste uma aposta".', 2],
      ['Dança uma música romântica com uma almofada durante 30 segundos.', 1],
      ['Deixa o grupo escolher uma palavra para pores no teu status.', 2],
      ['Faz 10 flexões enquanto gritas o nome de [Target Player].', 1],
      ['Conta a história mais embaraçosa da tua vida escolar em 30 segundos.', 2],
      ['Mostra o teu último like no Instagram ao grupo.', 2],
      ['Envia "gosto muito de ti, nunca te esqueças disso" a um contacto antigo.', 3],
      ['Bebe um shot e faz uma confissão sobre [Target Player].', 2],
      ['Dança o Macarena com expressão muito séria.', 1],
      ['Deixa [Target Player] escrever uma frase na tua mão.', 1],
      ['Faz um agachamento por cada pessoa na sala.', 1],
      ['Diz qualquer coisa com sotaque francês durante 1 minuto.', 1],
      ['Mostra a conversa mais antiga do teu WhatsApp.', 2],
      ['Imita um Youtuber a fazer unboxing de um objeto aleatório.', 2],
      ['Faz uma serenata para [Target Player] com uma música brega.', 2],
      ['Bebe um shot de algo que o grupo escolher.', 2],
      ['Fica de olhos fechados e deixa [Target Player] desenhar na tua cara.', 2],
      ['Conta uma piada e não te rias — se rires, bebe um shot.', 1],
      ['Dança como um pai numa festa de casamento.', 1],
      ['Envia um áudio de 10 segundos a cantar a [Target Player].', 2],
      ['Faz uma declaração de amor em forma de rap.', 2],
    ],
    '3|truth': [
      ['Qual foi a última vez que sentiste ciúmes de [Target Player]?', 3],
      ['Já tiveste um sonho erótico com alguém desta roda?', 3],
      ['Qual é a coisa mais ousada que já fizeste num primeiro encontro?', 2],
      ['Já beijaste alguém do mesmo sexo? Gostaste?', 3],
      ['Qual foi o sítio mais inapropriado onde já tiveste relações?', 3],
      ['Já mandaste nudes para a pessoa errada?', 3],
      ['Qual é a tua maior fantasia não realizada com [Target Player]?', 3],
      ['Já traíste e foste apanhado(a)? Como foi?', 3],
      ['Qual foi o teu momento mais intenso a sós com [Target Player]?', 3],
      ['Qual é o teu maior "trigger" sexual que nunca contaste?', 3],
      ['Já tiveste um orgasmo em público sem ninguém saber?', 3],
      ['Qual foi a experiência sexual mais arriscada da tua vida?', 3],
      ['Qual é a fantasia que te excita só de pensar?', 3],
      ['Já usaste Tinder só para sexo?', 3],
      ['O que farias com [Target Player] se estivessem sozinhos agora?', 3],
      ['Qual foi o melhor oral que já recebeste? Detalhes.', 3],
      ['Já fizeste sexo com mais de uma pessoa na mesma semana?', 3],
      ['Qual é a tua posição favorita para dares prazer a [Target Player]?', 3],
    ],
    '3|dare': [
      ['Lambe o pescoço de [Target Player] lentamente durante 15 segundos.', 3],
      ['Senta-te no colo de [Target Player] e sussurra-lhe um segredo.', 3],
      ['Tira uma peça de roupa à escolha do grupo.', 3],
      ['Faz uma massagem nas costas de [Target Player] por baixo da roupa.', 3],
      ['Dá um beijo no pescoço de [Target Player] e desce até ao ombro.', 3],
      ['Dança colado(a) a [Target Player] durante 1 minuto.', 3],
      ['Deixa [Target Player] tocar na parte do teu corpo que quiser.', 3],
      ['Fica só de roupa interior durante esta ronda.', 3],
      ['Beija a barriga de [Target Player] descendo lentamente.', 3],
      ['Deixa o grupo amarrar-te as mãos com o que tiverem.', 3],
      ['Dá um beijo de língua em [Target Player] durante 15 segundos.', 3],
      ['Faz uma massagem nas pernas de [Target Player] subindo devagar.', 3],
      ['Sussurra algo proibido ao ouvido de [Target Player].', 3],
      ['Fica vendado(a) e deixa [Target Player] fazer-te o que quiser por 1 minuto.', 3],
      ['Lambe algo do corpo de [Target Player] (álcool, mel, etc).', 3],
      ['Tira a camisola e dança lentamente para o grupo.', 3],
      ['Beija [Target Player] do pescoço até ao peito.', 3],
      ['Deixa [Target Player] dar-te uma palmada onde quiseres.', 3],
      ['Faz uma pose provocante e mantém-na 20 segundos.', 3],
      ['Passa gelo pelo corpo de [Target Player] com a boca.', 3],
      ['Senta-te de frente para [Target Player] com as pernas à volta.', 3],
      ['Faz um strip parcial (duas peças) ao som de música lenta.', 3],
      ['Beija a parte interna da coxa de [Target Player].', 3],
      ['Deixa [Target Player] desenhar no teu corpo com os dedos.', 3],
      ['Dança de forma erótica para [Target Player] de olhos vendados.', 3],
      ['Faz carícias em [Target Player] sem usar as mãos.', 3],
      ['Deixa [Target Player] tocar-te por baixo da roupa durante 15 segundos.', 3],
      ['Fala de forma provocante ao ouvido de [Target Player] durante 20 segundos.', 3],
      ['Ajoelha-te em frente a [Target Player] e mantém a posição 30 segundos.', 3],
      ['Faz uma videochamada de 15 segundos para um contacto aleatório a cantar.', 2],
      ['Deixa [Target Player] escolher uma música para fazeres playback.', 1],
      ['Faz uma dança com uma vassoura durante 30 segundos.', 1],
    ],
    '4|truth': [
      ['Já fizeste sexo a três? Como foi a dinâmica?', 3],
      ['Qual foi o sítio mais público onde tiveste um orgasmo?', 3],
      ['Já tiveste relações com alguém comprometido? Quem?', 3],
      ['Qual é a coisa mais extrema que farias para ter prazer?', 3],
      ['Já tiveste sexo com alguém que mal conhecias? Em quanto tempo?', 3],
      ['Qual foi o teu fetiche mais intenso que experimentaste?', 3],
      ['Já filmaste ou foste filmado(a) durante o ato?', 3],
      ['Qual é a fantasia que nunca realizarias mas que te excita?', 3],
      ['Já praticaste BDSM pesado? O que fizeste?', 3],
      ['Qual foi a maior loucura sexual que fizeste?', 3],
      ['Já tiveste sexo com um estranho dentro de 1h após conhecer?', 3],
      ['Qual é o teu maior segredo sobre a tua vida sexual?', 3],
      ['Já te envolveste com mais de duas pessoas ao mesmo tempo?', 3],
      ['Qual foi o teu limite ultrapassado no sexo?', 3],
      ['Já fizeste algo sexual que nunca repetirias? O quê?', 3],
      ['Qual é a coisa mais depravada que já pesquisaste na internet?', 3],
      ['Já estiveste num clube de swing? Como foi?', 3],
      ['Qual foi a proposta sexual mais estranha que já recebeste?', 3],
      ['Já tiveste relações com alguém enquanto outra pessoa dormia ao lado?', 3],
      ['Qual é o teu verdadeiro body count?', 3],
      ['Já filmaste algo íntimo que ainda hoje existe?', 3],
      ['Qual foi o ato mais intenso de submissão que já fizeste?', 3],
      ['Já usaste drogas para potenciar o sexo?', 3],
      ['Qual é a tua experiência mais extrema com brinquedos?', 3],
      ['Já tiveste sexo com alguém que nunca mais viste?', 3],
      ['Qual foi o pedido sexual mais estranho que te fizeram?', 3],
      ['Já aceitaste dinheiro ou favores por algo sexual?', 3],
      ['Qual é a maior perversão que admites ter?', 3],
      ['Já fizeste algo sexual que te envergonha profundamente?', 3],
      ['Qual foi a situação mais arriscada em que tiveste prazer?', 3],
      ['Já tiveste relações em troca de algo que querias muito?', 3],
      ['Qual foi o teu momento mais animalesco na cama?', 3],
      ['Já praticaste asfixia erótica até ao limite?', 3],
    ],
    '4|dare': [
      ['Faz sexo oral em [Target Player] até ao fim.', 3],
      ['Deixa [Target Player] fazer-te o que quiser durante 5 minutos.', 3],
      ['Fica nu(a) e deixa o grupo observar-te durante 2 minutos.', 3],
      ['Dá prazer a [Target Player] só com a boca.', 3],
      ['Deixa [Target Player] amarrar-te à cadeira e provocar-te.', 3],
      ['Faz um strip completo até ficares nu(a).', 3],
      ['Toca em [Target Player] de forma explícita durante 1 minuto.', 3],
      ['Deixa que o grupo te dê ordens durante 3 rondas.', 3],
      ['Dá palmadas fortes em [Target Player] até a pele ficar marcada.', 3],
      ['Deixa [Target Player] usar um brinquedo sexual em ti.', 3],
      ['Masturba-te em frente ao grupo durante 1 minuto.', 3],
      ['Deixa [Target Player] e outro jogador tocarem-te ao mesmo tempo.', 3],
      ['Faz sexo simulado com [Target Player] em 3 posições diferentes.', 3],
      ['Lambe o corpo inteiro de [Target Player] da cabeça aos pés.', 3],
      ['Deixa [Target Player] acabar onde quiser em ti.', 3],
      ['Fica de quatro e deixa [Target Player] fazer o que quiser.', 3],
      ['Dá prazer a [Target Player] com as mãos atrás das costas.', 3],
      ['Deixa o grupo escolher uma parte do teu corpo para lamberes.', 3],
      ['Faz o papel de escravo(a) de [Target Player] durante 5 minutos.', 3],
      ['Deixa toda a gente tocar no teu corpo ao mesmo tempo.', 3],
      ['Senta-te na cara de [Target Player] (com roupa).', 3],
      ['Faz um show erótico completo para o grupo.', 3],
      ['Deixa [Target Player] vendar-te e usar o que quiser em ti.', 3],
      ['Dá prazer a [Target Player] enquanto outra pessoa observa de perto.', 3],
      ['Faz sexo oral em [Target Player] numa posição dominante.', 3],
      ['Deixa o grupo tirar-te a roupa peça a peça.', 3],
      ['Simula sexo com [Target Player] em cima da mesa.', 3],
      ['Deixa [Target Player] controlar o teu prazer durante 3 minutos.', 3],
      ['Ajoelha-te e serve [Target Player] durante 2 rondas.', 3],
      ['Deixa [Target Player] fazer-te o que o grupo decidir.', 3],
      ['Dá um espetáculo de pole dance imaginário.', 3],
      ['Faz um streaking de uma ponta à outra da sala.', 3],
      ['Recebe ordens de [Target Player] sem questionar durante 5 minutos.', 3],
      ['Lambe os dedos dos pés de [Target Player] um por um.', 3],
      ['Simula o teu melhor orgasmo em frente ao grupo.', 3],
    ],
  };
  const key = tier + '|' + type;
  const cards = (all[key] || []).map((c) => ({ text: c[0], shots: c[1] }));
  return cards.slice(0, count);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

function parseCardsMarkdown(md) {
  const lines = md.split('\n');
  const results = [];
  let currentTier = null,
    currentType = null,
    inTable = false;
  for (const line of lines) {
    const tm = line.match(/^##\s+.*Tier\s+(\d)/);
    if (tm) {
      currentTier = parseInt(tm[1], 10);
      inTable = false;
      continue;
    }
    if (line.startsWith('###') && (line.includes('Verdades') || line.includes('Verdade'))) {
      currentType = 'truth';
      inTable = false;
      continue;
    }
    if (line.startsWith('###') && (line.includes('Desafios') || line.includes('Desafio'))) {
      currentType = 'dare';
      inTable = false;
      continue;
    }
    if (line.match(/^\|\s*#\s*\|/)) {
      inTable = true;
      continue;
    }
    if (line.match(/^\|[-| ]+\|/)) continue;
    if (line.match(/^---\s*$/)) {
      inTable = false;
      continue;
    }
    if (inTable && currentTier && currentType && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c !== '');
      if (cells.length >= 3) {
        const rawText = cells[1];
        const fixedText = fixText(rawText);
        results.push({
          text: fixedText,
          originalText: rawText,
          wasFixed: rawText !== fixedText,
          shots: parseShots(cells[2]),
          tier: currentTier,
          type: currentType,
        });
      }
    }
  }
  return results;
}

const cards = parseCardsMarkdown(readFileSync('./CARDS.md', 'utf-8'));
console.log(cards.length + ' cards parsed from CARDS.md');

// Report fixes
const fixed = cards.filter((c) => c.wasFixed);
console.log(fixed.length + ' directional refs fixed → [Target Player]');

// Dedup: normalize rounds→rondas for comparison
const seen2 = new Map();
const unique = [];
let dupes = 0;
for (const c of cards) {
  const key = normalize(c.text).replace(/rounds/gi, 'rondas');
  if (!seen2.has(key)) {
    seen2.set(key, c);
    unique.push(c);
  } else {
    dupes++;
  }
}
console.log(unique.length + ' unique, ' + dupes + ' duplicates removed');

// Replacement needs
const needs = {};
for (let t = 1; t <= 4; t++) {
  for (const ty of ['truth', 'dare']) {
    const have = unique.filter((c) => c.tier === t && c.type === ty).length;
    const need = Math.max(0, 100 - have);
    if (need > 0) needs[t + '|' + ty] = need;
  }
}
for (const [key, count] of Object.entries(needs)) {
  const [t, ty] = key.split('|');
  console.log('Need Tier ' + t + ' ' + ty + ': ' + count);
  for (const r of getReplacements(parseInt(t), ty, count)) {
    unique.push({
      text: r.text,
      originalText: r.text,
      wasFixed: false,
      shots: r.shots,
      tier: parseInt(t),
      type: ty,
    });
  }
}

// Build final dataset
const dataset = unique.map((c, i) => {
  const { hasRounds: hr, roundsCount: rc } = parseRounds(c.text);
  return {
    id: i + 1,
    type: c.type,
    tier: c.tier,
    rawText: c.text,
    shots: c.shots,
    hasTarget: hasTarget(c.text),
    roundsCount: rc,
    hasRounds: hr,
    timerSeconds: extractTimerSeconds(c.text, c.type),
  };
});

writeFileSync('./src/data/dataset.json', JSON.stringify(dataset, null, 2) + '\n');

console.log('\nFinal: ' + dataset.length + ' cards');
for (let t = 1; t <= 4; t++) {
  const tc = dataset.filter((c) => c.tier === t);
  console.log(
    'Tier ' +
      t +
      ': ' +
      tc.length +
      ' (t:' +
      tc.filter((c) => c.type === 'truth').length +
      ' d:' +
      tc.filter((c) => c.type === 'dare').length +
      ' targets:' +
      tc.filter((c) => c.hasTarget).length +
      ' timer:' +
      tc.filter((c) => c.timerSeconds !== null).length +
      ' rounds:' +
      tc.filter((c) => c.hasRounds).length +
      ')',
  );
}
