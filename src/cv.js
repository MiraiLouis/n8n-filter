const { PROFIL } = require('./profil');
const { contenuMessage, extraireJson } = require('./mistral');
const { texteRicheLong } = require('./notion');

function lireRich(prop) {
  if (!prop) return '';
  const blocs = prop.rich_text || prop.title || [];
  return blocs.map((bloc) => bloc.plain_text || (bloc.text && bloc.text.content) || '').join('');
}

function competencesDepuisNotion(resultats) {
  const data = resultats && resultats.results
    ? resultats
    : (resultats && resultats.resultatsCompetences) || {};
  const results = data.results || [];
  return results.map((page) => {
    const props = page.properties || {};
    return {
      competence: lireRich(props['Compétence'] || props.Competence || props.Nom),
      type: (props.Type && props.Type.select && props.Type.select.name) || '',
      texte: lireRich(props.Texte),
      motsCles: lireRich(props['Mots-clés'] || props['Mots-cles'] || props.MotsCles),
    };
  }).filter((ligne) => ligne.competence || ligne.texte);
}

function formaterCompetences(lignes) {
  return lignes.map((ligne) => {
    const nom = ligne.competence || 'Sans titre';
    const type = ligne.type ? ` (${ligne.type})` : '';
    return `- ${nom}${type} : ${ligne.texte || ''}`;
  }).join('\n');
}

function corpsMistralCv(offre, competences) {
  const lignes = competences && competences.length ? competences : PROFIL.competences;
  const systeme = [
    'Tu rédiges un CV ciblé en français, en texte brut.',
    'Tu réponds uniquement avec un objet JSON {"cv":"..."} .',
    'Tu utilises seulement les expériences, projets et compétences fournis. Tu n\'inventes aucun employeur, aucune date, aucun outil.',
    'Les stages restent des stages. Tu ne les présentes pas comme des CDI.',
    'Tu gardes ce qui sert l\'offre et tu retires le reste.',
    'Sections, dans cet ordre : En-tête, Profil, Formation, Expérience, Projets, Compétences, Langues.',
    'L\'en-tête reprend le nom et les coordonnées fournis.',
  ].join('\n');
  const utilisateur = [
    `Identité : ${PROFIL.nom}, ${PROFIL.intitule}`,
    `Email : ${PROFIL.email}`,
    `Téléphone : ${PROFIL.telephone}`,
    `LinkedIn : ${PROFIL.linkedin}`,
    `GitHub : ${PROFIL.github}`,
    '',
    `Offre visée : ${offre.titre || ''}`,
    `Entreprise : ${offre.entreprise || offre.entreprisePage || ''}`,
    `Lien : ${offre.lien || ''}`,
    '',
    'Texte de l\'offre :',
    offre.texteOffre || offre.extrait || '',
    '',
    'Compétences et expériences autorisées :',
    formaterCompetences(lignes),
  ].join('\n');

  return {
    model: 'mistral-small-latest',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systeme },
      { role: 'user', content: utilisateur },
    ],
  };
}

function lireCv(reponse) {
  const data = extraireJson(contenuMessage(reponse));
  const cv = String(data.cv || data.texte || '').trim();
  if (!cv) throw new Error('CV absent de la réponse Mistral');
  return cv;
}

function patchCv(pageId, cv) {
  return {
    pageId: pageId || '',
    body: {
      properties: {
        CV: texteRicheLong(cv),
      },
    },
  };
}

function ecrireCv(offre) {
  let cv = '';
  let erreurCv = '';
  try {
    cv = lireCv(offre.reponseCv || offre);
  } catch (error) {
    erreurCv = error.message;
  }
  const pageId = offre.pageNotion && offre.pageNotion.id;
  return {
    ...offre,
    cv,
    erreurCv,
    patchCv: pageId && cv ? patchCv(pageId, cv) : null,
  };
}

module.exports = {
  competencesDepuisNotion,
  corpsMistralCv,
  lireCv,
  ecrireCv,
};
