const { normaliser } = require('./texte');

const UNITE = '(?:ans|annees|years|yrs)';

const SENIOR_TITRE = [
  /\bsenior\b/,
  /\blead\b/,
  /\bstaff\b/,
  /\bprincipal\b/,
  /\bhead of\b/,
  /\bdirecteurs?\b/,
  /\bdirectrices?\b/,
  /\bengineering manager\b/,
  /\bvp\b/,
  /\bcto\b/,
  /\bresponsable d'?\s*equipe\b/,
];

const HORS_DOMAINE = /\b(comptable|infirmier|infirmiere|aide[- ]soignant|chauffeur|boulanger|serveur|serveuse|cuisinier|vendeur|vendeuse|commercial|commerciale|avocat|notaire|agent d'entretien|preparateur de commandes)\b/;

const PHRASES_DOMAINE = [
  'intelligence artificielle',
  'machine learning',
  'deep learning',
  'data science',
  'data scientist',
  'data engineer',
  'data engineering',
  'data analyst',
  'donnees',
  'logiciel',
  'software',
  'developpement',
  'developpeur',
  'developer',
  'fullstack',
  'full stack',
  'full-stack',
  'backend',
  'frontend',
  'front-end',
  'informatique',
  'programmation',
  'computer vision',
  'vision par ordinateur',
  'business intelligence',
  'power bi',
];

function occupe(plages, debut, fin) {
  return plages.some(([a, b]) => debut < b && fin > a);
}

function experienceMotifs(texte) {
  const t = normaliser(texte);
  const motifs = [];
  const plages = [];
  const noter = (debut, fin, motif) => {
    plages.push([debut, fin]);
    if (motif && !motifs.includes(motif)) motifs.push(motif);
  };

  const parcourir = (regex, lire) => {
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    let match;
    while ((match = re.exec(t))) {
      if (!occupe(plages, match.index, match.index + match[0].length)) lire(match);
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  };

  parcourir(new RegExp(`\\b(?:pas plus de|no more than|not more than|moins de|under|maximum|max\\.?|au plus)\\s*(\\d{1,2})\\s*${UNITE}\\b`, 'g'), (match) => {
    noter(match.index, match.index + match[0].length, '');
  });

  parcourir(new RegExp(`(\\d{1,2})\\s*(?:-|–|—|\\ba\\b|\\bto\\b|\\bet\\b)\\s*(\\d{1,2})\\s*${UNITE}\\b`, 'g'), (match) => {
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (min > 20 || max > 20 || max < min) return;
    const motif = max > 3 ? `Expérience demandée : ${min}-${max} ans` : '';
    noter(match.index, match.index + match[0].length, motif);
  });

  parcourir(new RegExp(`(?:jusqu'a|jusqu a|up to)\\s*(\\d{1,2})\\s*${UNITE}\\b`, 'g'), (match) => {
    const n = Number(match[1]);
    if (n > 20) return;
    const motif = n > 3 ? `Expérience demandée : jusqu'à ${n} ans` : '';
    noter(match.index, match.index + match[0].length, motif);
  });

  parcourir(new RegExp(`(?:au moins|minimum(?:\\s+de)?|min\\.?|at least)\\s*(\\d{1,2})\\s*(?:\\+\\s*)?${UNITE}\\b`, 'g'), (match) => {
    const n = Number(match[1]);
    if (n > 20) return;
    const motif = n >= 3 ? `Expérience demandée : minimum ${n} ans` : '';
    noter(match.index, match.index + match[0].length, motif);
  });

  parcourir(new RegExp(`plus de\\s*(\\d{1,2})\\s*${UNITE}\\b`, 'g'), (match) => {
    const n = Number(match[1]);
    if (n >= 3 && n <= 20) noter(match.index, match.index + match[0].length, `Expérience demandée : plus de ${n} ans`);
  });

  parcourir(new RegExp(`(\\d{1,2})\\s*${UNITE}\\s*(?:minimum|min\\.?|au moins|et plus|ou plus|\\+)\\b`, 'g'), (match) => {
    if (occupe(plages, match.index, match.index + match[0].length)) return;
    const n = Number(match[1]);
    if (n >= 3 && n <= 20) noter(match.index, match.index + match[0].length, `Expérience demandée : ${n} ans minimum`);
  });

  parcourir(new RegExp(`(\\d{1,2})\\s*\\+\\s*${UNITE}\\b`, 'g'), (match) => {
    if (occupe(plages, match.index, match.index + match[0].length)) return;
    const n = Number(match[1]);
    if (n >= 3 && n <= 20) noter(match.index, match.index + match[0].length, `Expérience demandée : ${n}+ ans`);
  });

  parcourir(/(?<!\d)(\d{1,2})\s*\+(?!\d)/g, (match) => {
    if (occupe(plages, match.index, match.index + match[0].length)) return;
    const n = Number(match[1]);
    if (n < 3 || n > 20) return;
    const autour = t.slice(Math.max(0, match.index - 24), match.index + match[0].length + 24);
    if (n !== 3 && !/ans|annees|years|yrs|experience/.test(autour)) return;
    noter(match.index, match.index + match[0].length, `Expérience demandée : ${n}+`);
  });

  parcourir(new RegExp(`(\\d{1,2})\\s*${UNITE}\\b`, 'g'), (match) => {
    if (occupe(plages, match.index, match.index + match[0].length)) return;
    const n = Number(match[1]);
    if (n > 3 && n <= 20) noter(match.index, match.index + match[0].length, `Expérience demandée : ${n} ans`);
  });

  return motifs;
}

function titreSenior(titre) {
  const t = normaliser(titre);
  return SENIOR_TITRE.some((regex) => regex.test(t));
}

function contratRejet(titre, extrait) {
  const titreN = normaliser(titre);
  const tout = normaliser(`${titre}\n${extrait}`);
  if (/\b(stage|stagiaire|alternance|alternant|apprentissage|freelance|free-lance|free lance|portage salarial|auto-entrepreneur)\b/.test(titreN)) {
    return 'Contrat stage, alternance ou freelance';
  }
  if (/\b(cdi|cdd)\b/.test(tout) && /\bstagiaires?\b/.test(tout) && /\b(encadr|tuteur)\b/.test(tout)) {
    return null;
  }
  if (/\b(offre de stage|contrat en alternance|en alternance|poste en freelance|mission freelance|portage salarial)\b/.test(tout)) {
    return 'Contrat stage, alternance ou freelance';
  }
  return null;
}

function doctoratRejet(texte) {
  const t = normaliser(texte);
  if (!/\b(doctorat|phd|ph\.?\s*d\.?|bac\s*\+\s*8)\b/.test(t)) return null;
  const exige = /(requis|required|exige|obligatoire|titulaire|holder of)/.test(t);
  const plus = /(est un plus|un plus|atout|souhaite|apprecie|optionnel|non requis)/.test(t);
  if (plus && !exige) return null;
  return 'Doctorat exigé';
}

function toucheDomaine(texte) {
  const t = normaliser(texte);
  if (PHRASES_DOMAINE.some((phrase) => t.includes(phrase))) return true;
  return /\b(ia|ai|data|ml|sql|nlp|llm|rag|python|java|javascript|react|docker|kubernetes|devops|backend|frontend|api)\b/.test(t);
}

function domaineRejet(titre, extrait) {
  const tout = `${titre}\n${extrait}`;
  if (toucheDomaine(tout)) return null;
  const t = normaliser(tout);
  if (HORS_DOMAINE.test(t)) return 'Hors IA, data, logiciel et développement';
  const lettres = t.replace(/\s+/g, '');
  if (lettres.length >= 120) return 'Hors IA, data, logiciel et développement';
  return null;
}

function evaluerRegles(offre) {
  const titre = offre.titre || '';
  const extrait = offre.extrait || '';
  const texte = `${titre}\n${extrait}`;
  const motifs = [];

  if (titreSenior(titre)) motifs.push('Titre senior ou équivalent');
  motifs.push(...experienceMotifs(texte));

  const contrat = contratRejet(titre, extrait);
  if (contrat) motifs.push(contrat);

  const doctorat = doctoratRejet(texte);
  if (doctorat) motifs.push(doctorat);

  const domaine = domaineRejet(titre, extrait);
  if (domaine) motifs.push(domaine);

  const experience = motifs.find((motif) => motif.startsWith('Expérience demandée'));
  return {
    rejetEvident: motifs.length > 0,
    motifs,
    decision: motifs.length > 0 ? 'rejetee' : 'a_analyser',
    anneesDemandees: experience ? experience.replace('Expérience demandée : ', '') : '',
  };
}

module.exports = {
  evaluerRegles,
  experienceMotifs,
  titreSenior,
};
