const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dossier = path.join(root, 'n8n');

function lire(...fichiers) {
  return fichiers.map((fichier) => {
    const src = fs.readFileSync(path.join(root, fichier), 'utf8');
    return src
      .replace(/^const\s+\{[^}]+\}\s*=\s*require\([^)]+\);\r?\n/gm, '')
      .replace(/^const\s+\w+\s*=\s*require\([^)]+\);\r?\n/gm, '')
      .replace(/\r?\nmodule\.exports\s*=\s*\{[\s\S]*?\};?\s*$/, '\n');
  }).join('\n');
}

function ecrire(fichier, contenu) {
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, fichier), contenu.trim() + '\n', 'utf8');
}

const entete = (titre, mode) => `// ${titre}
// Mode du nœud Code : ${mode}
// Coller tout ce fichier dans le nœud. Ne pas ajouter de require.

`;

ecrire('01-decouper-offres.js', `${entete('01 — Découper les offres', 'Run Once for All Items')}
${lire('src/texte.js', 'src/extraire-offres.js')}
const offres = [];
for (const item of $input.all()) {
  offres.push(...decouperMail(item.json));
}
return offres.map((offre) => ({ json: offre }));
`);

ecrire('02-regles.js', `${entete('02 — Règles', 'Run Once for Each Item')}
${lire('src/texte.js', 'src/regles.js')}
const resultat = evaluerRegles($input.item.json);
return { json: { ...$input.item.json, ...resultat } };
`);

ecrire('03-lire-page.js', `${entete('03 — Lire la page', 'Run Once for Each Item')}
${lire('src/texte.js', 'src/lire-page.js')}
const offre = $input.item.json;
const page = lirePage(offre.pageHtml);
return {
  json: {
    ...offre,
    ...page,
    titre: page.titrePage || offre.titre,
    entreprise: offre.entreprise || page.entreprisePage || '',
    localisation: offre.localisation || page.localisationPage || '',
  },
};
`);

ecrire('04-prompt-mistral.js', `${entete('04 — Prompt Mistral', 'Run Once for Each Item')}
${lire('src/mistral.js')}
const offre = $input.item.json;
return { json: { ...offre, mistralBody: corpsMistral(offre) } };
`);

ecrire('05-lire-reponse-mistral.js', `${entete('05 — Lire la réponse Mistral', 'Run Once for Each Item')}
${lire('src/mistral.js')}
const offre = $input.item.json;
try {
  const lu = lireReponseMistral(offre.reponseMistral);
  return { json: fusionnerReponse(offre, lu) };
} catch (error) {
  return {
    json: {
      ...offre,
      decision: 'incertain',
      analyse: String(error.message || error),
      motifsIa: [],
    },
  };
}
`);

ecrire('06-corps-notion.js', `${entete('06 — Corps de la page Notion', 'Run Once for Each Item')}
// Remplace cet identifiant par celui de la base Offres.
const NOTION_DATABASE_ID = 'COLLER_ID_BASE_OFFRES';

${lire('src/notion.js')}
const offre = $input.item.json;
return { json: { ...offre, corpsNotion: corpsNotion(offre, NOTION_DATABASE_ID) } };
`);

ecrire('07-prompt-cv.js', `${entete('07 — CV', 'Run Once for Each Item')}
// Premier collage, avant l'appel Mistral du CV : laisser 'prompt'.
// Second collage, après la réponse Mistral : remplacer par 'patch'.
const MODE = 'prompt';

${lire('src/profil.js', 'src/mistral.js', 'src/notion.js', 'src/cv.js')}
const offre = $input.item.json;

if (MODE === 'patch') {
  return { json: ecrireCv(offre) };
}

if (!['compatible', 'limite'].includes(offre.decision)) {
  return { json: { ...offre, genererCv: false } };
}

const competences = competencesDepuisNotion(offre.resultatsCompetences);
return {
  json: {
    ...offre,
    genererCv: true,
    mistralCv: corpsMistralCv(offre, competences),
  },
};
`);
