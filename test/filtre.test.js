const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const { decouperMail } = require('../src/extraire-offres');
const { evaluerRegles } = require('../src/regles');
const { lirePage } = require('../src/lire-page');
const { corpsMistral, lireReponseMistral, fusionnerReponse } = require('../src/mistral');
const { corpsNotion } = require('../src/notion');
const { competencesDepuisNotion, corpsMistralCv, ecrireCv } = require('../src/cv');

function offre(titre, extrait) {
  return evaluerRegles({ titre, extrait, lien: 'https://exemple.fr/jobs/1' });
}

test('un mail LinkedIn devient une offre par lien', () => {
  const html = `
    <a href="https://www.linkedin.com/comm/jobs/view/4012345678?refId=abc&amp;trackingId=xyz">Ingénieur IA junior</a>
    Alpha · Paris · CDI · jusqu'à 2 ans
    <a href="https://www.linkedin.com/comm/jobs/view/4012345678?utm_source=alerte">Ingénieur IA junior</a>
    <a href="https://www.linkedin.com/comm/jobs/view/4012349999">Staff Machine Learning Engineer</a>
    8+ ans d'expérience
    <a href="https://www.linkedin.com/help/linkedin">Aide</a>
    <a href="https://fr.indeed.com/viewjob?jk=abc123">Data scientist</a>
    3 à 5 ans d'expérience
    <a href="https://www.google.com/url?q=https%3A%2F%2Fwww.apec.fr%2Fcandidat%2Femploi%2Fdetail-offre%2F55">Voir l'offre</a>
    Développeur Python, Paris
  `;
  const offres = decouperMail({
    id: 'm1',
    subject: 'Alerte emploi',
    html,
    text: '',
    date: '2026-10-25T08:00:00.000Z',
    from: { text: 'LinkedIn <jobs-noreply@linkedin.com>' },
  });

  assert.equal(offres.length, 4);
  assert.equal(offres[0].source, 'LinkedIn');
  assert.equal(offres[0].titre, 'Ingénieur IA junior');
  assert.equal(offres[0].lien.includes('utm_source'), false);
  assert.equal(offres[1].titre, 'Staff Machine Learning Engineer');
  assert.equal(offres[2].source, 'Indeed');
  assert.equal(offres[3].source, 'Apec');
  assert.match(offres[3].lien, /apec\.fr/);
  assert.equal(offres[0].messageId, 'm1');
});

test('sans lien, le mail reste une offre', () => {
  const offres = decouperMail({
    id: 'm2',
    subject: 'Votre alerte',
    html: '<p>Bonjour</p>',
    text: 'Une piste à regarder',
    from: 'alerts@exemple.fr',
  });
  assert.equal(offres.length, 1);
  assert.equal(offres[0].lien, '');
  assert.equal(offres[0].titre, 'Une piste à regarder');
});

test('les règles dures rejettent ou laissent passer', () => {
  const cas = [
    ['Senior Data Engineer', 'CDI à Paris', true],
    ['Ingénieur IA junior', 'Rejoignez une équipe senior. Python, jusqu\'à 2 ans.', false],
    ['Ingénieur confirmé', 'Poste data, expert du sujet, CDI', false],
    ['Expert NLP', 'CDI, jeune diplôme accepté', false],
    ['Data scientist', '3 ans d\'expérience', false],
    ['Data scientist', '3 ans minimum', true],
    ['Data scientist', 'au moins 3 ans', true],
    ['Développeur Python', '3+', true],
    ['Développeur Python', 'plus de 3 ans d\'expérience', true],
    ['Développeur Python', '1 à 3 ans', false],
    ['Développeur Python', '0-2 ans', false],
    ['Développeur Python', 'jusqu\'à 3 ans', false],
    ['Développeur Python', '2-4 ans', true],
    ['Développeur Python', '3 à 5 ans', true],
    ['Développeur Python', '5 ans d\'expérience', true],
    ['Développeur Python', 'moins de 5 ans d\'expérience', false],
    ['Développeur Python', 'pas plus de 3 ans', false],
    ['Développeur Python', 'équipe de moins de 30 ans', false],
    ['Stage - Data analyst', 'Paris', true],
    ['Développeur Python', 'CDI. Encadrer des stagiaires.', false],
    ['Data engineer', 'contrat en alternance', true],
    ['Machine learning engineer', 'PhD required', true],
    ['Data scientist', 'Doctorat est un plus. CDI.', false],
    ['Commercial terrain', 'Paris', true],
    ['Leadership et data', 'CDI', false],
    ['Tech Lead data', 'CDI', true],
  ];

  cas.forEach(([titre, extrait, rejet]) => {
    assert.equal(offre(titre, extrait).rejetEvident, rejet, `${titre} | ${extrait}`);
  });
});

test('un texte long hors métier est rejeté, un extrait court non', () => {
  const long = offre('Assistant', 'gestion administrative des dossiers du siege et accueil des visiteurs '.repeat(4));
  const court = offre('Offre', 'Bonjour');
  assert.equal(long.rejetEvident, true);
  assert.equal(court.rejetEvident, false);
  assert.equal(court.decision, 'a_analyser');
});

test('la page JSON-LD est lue même si le reste parle de connexion', () => {
  const html = `
    <script type="application/ld+json">
      {"@type":"JobPosting","title":"Ingénieur IA junior","description":"<p>RAG et Python. Conception d'agents et évaluation des modèles sur un cas réel de bout en bout, avec une mise en production suivie et une documentation des résultats pour les équipes métier.</p>","hiringOrganization":{"name":"Thales"},"employmentType":"FULL_TIME","jobLocation":{"address":{"addressLocality":"Vélizy"}}}
    </script>
    <p>Sign in to LinkedIn</p>
  `;
  const page = lirePage(html);
  assert.equal(page.lecture, 'complète');
  assert.match(page.texteOffre, /RAG et Python/);
  assert.equal(page.entreprisePage, 'Thales');
  assert.equal(page.titrePage, 'Ingénieur IA junior');
  assert.equal(page.localisationPage, 'Vélizy');
  assert.equal(page.contratPage, 'CDI');
});

test('une page de connexion reste au texte du mail', () => {
  const page = lirePage('<html><body><h1>Sign in</h1><p>Join LinkedIn to see this job</p></body></html>');
  assert.equal(page.lecture, 'mail seul');
  assert.equal(page.texteOffre, '');
  assert.equal(lirePage('').lecture, 'mail seul');
});

test('Mistral : prompt, JSON enclos, fusion', () => {
  const body = corpsMistral({
    titre: 'Ingénieur IA',
    source: 'Indeed',
    lien: 'https://fr.indeed.com/viewjob?jk=1',
    lecture: 'complète',
    texteOffre: 'CDI, Python, 1 à 2 ans',
    extrait: 'Paris',
  });
  assert.equal(body.model, 'mistral-small-latest');
  assert.equal(body.messages[0].role, 'system');

  const lu = lireReponseMistral({
    choices: [{ message: { content: '```json\n{"decision":"compatible","annees":"1-2","experienceOk":true,"missionsOk":true,"contrat":"CDI","titre":"Ingénieur IA","entreprise":"Acme","localisation":"Paris","motifs":["Métier IA"],"analyse":"Premier poste accessible."}\n```' } }],
  });
  const fusion = fusionnerReponse({ titre: 'Ancien titre', motifs: ['Règles muettes'], contratPage: '' }, lu);
  assert.equal(fusion.decision, 'compatible');
  assert.equal(fusion.entreprise, 'Acme');
  assert.equal(fusion.titre, 'Ingénieur IA');
  assert.deepEqual(fusion.motifs, ['Règles muettes', 'Métier IA']);
});

test('la page Notion couvre un rejet et une offre compatible', () => {
  const rejet = corpsNotion({
    titre: 'Staff Engineer',
    source: 'LinkedIn',
    lien: 'https://www.linkedin.com/jobs/view/1',
    dateMail: '2026-10-25T08:00:00.000Z',
    messageId: 'abc',
    sujet: 'Alerte',
    rejetEvident: true,
    decision: 'rejetee',
    motifs: ['Titre senior ou équivalent'],
    extrait: 'Paris',
  }, 'base-offres');
  assert.equal(rejet.parent.database_id, 'base-offres');
  assert.equal(rejet.properties.Statut.select.name, 'Rejetée (règles)');
  assert.equal(rejet.properties['Expérience OK'].checkbox, false);
  assert.equal(rejet.properties.Lecture.select.name, 'mail seul');
  assert.equal(rejet.properties.Empreinte.rich_text[0].text.content, 'abc|https://www.linkedin.com/jobs/view/1');

  const garde = corpsNotion({
    titre: 'Ingénieur IA',
    decision: 'compatible',
    experienceOk: true,
    missionsOk: true,
    contrat: 'CDI',
    lecture: 'complète',
    lien: 'https://exemple.fr/jobs/2',
    analyse: 'Ça colle.',
  });
  assert.equal(garde.properties.Statut.select.name, 'À postuler');
  assert.equal(garde.properties.Contrat.select.name, 'CDI');
  assert.equal(garde.properties.Décision.select.name, 'compatible');
  assert.equal(garde.properties.Lien.url, 'https://exemple.fr/jobs/2');
  assert.equal(corpsNotion({ titre: 'Sans lien', rejetEvident: true, decision: 'rejetee', motifs: [] }).properties.Lien.url, null);
});

test('le CV pioche les compétences Notion et prépare le patch', () => {
  const lignes = competencesDepuisNotion({
    results: [{
      properties: {
        Compétence: { title: [{ plain_text: 'RAG' }] },
        Type: { select: { name: 'technique' } },
        Texte: { rich_text: [{ plain_text: 'Système RAG chez Thales.' }] },
        'Mots-clés': { rich_text: [{ plain_text: 'rag' }] },
      },
    }],
  });
  assert.equal(lignes[0].competence, 'RAG');
  const prompt = corpsMistralCv({ titre: 'Ingénieur IA', texteOffre: 'RAG et agents' }, lignes);
  assert.match(prompt.messages[1].content, /Système RAG chez Thales/);
  assert.match(prompt.messages[1].content, /Louis Chen/);

  const ecrit = ecrireCv({
    decision: 'compatible',
    pageNotion: { id: 'page-1' },
    reponseCv: { choices: [{ message: { content: '{"cv":"CV ciblé"}' } }] },
  });
  assert.equal(ecrit.cv, 'CV ciblé');
  assert.equal(ecrit.patchCv.pageId, 'page-1');
  assert.equal(ecrit.patchCv.body.properties.CV.rich_text[0].text.content, 'CV ciblé');
});

test('les scripts collables tournent sans require', () => {
  const dossier = path.join(__dirname, '..', 'n8n');
  for (const fichier of fs.readdirSync(dossier)) {
    if (!fichier.endsWith('.js')) continue;
    const code = fs.readFileSync(path.join(dossier, fichier), 'utf8');
    assert.equal(code.includes('require('), false, fichier);
    assert.equal(code.includes('module.exports'), false, fichier);
  }

  const regles = fs.readFileSync(path.join(dossier, '02-regles.js'), 'utf8');
  const run = new Function('$input', regles);
  const resultat = run({ item: { json: { titre: 'Senior Data Engineer', extrait: 'CDI' } } });
  assert.equal(resultat.json.rejetEvident, true);

  const decouper = new Function('$input', fs.readFileSync(path.join(dossier, '01-decouper-offres.js'), 'utf8'));
  const lignes = decouper({
    all() {
      return [{
        json: {
          id: 'm1',
          subject: 'Alerte',
          html: '<a href="https://www.welcometothejungle.com/fr/companies/acme/jobs/ia_1">Ingénieur IA</a>',
          text: '',
          date: '2026-10-25',
          from: 'jobs@welcometothejungle.com',
        },
      }];
    },
  });
  assert.equal(lignes[0].json.source, 'Welcome to the Jungle');
});
