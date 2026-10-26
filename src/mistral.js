const SYSTEME = [
  "Tu filtres une offre d'emploi pour Louis Chen, ingénieur en intelligence artificielle diplômé en 2025.",
  "Son expérience professionnelle se limite à des stages : IA appliquée chez Thales (RAG, agents, environ 6 mois) et SecOps à l'Institut Curie. Il n'a pas eu de CDI ni de CDD.",
  "Tu réponds uniquement avec un objet JSON, sans texte autour.",
  "Clés obligatoires : decision, annees, experienceOk, missionsOk, contrat, titre, entreprise, localisation, motifs, analyse.",
  "decision vaut exactement : compatible, limite, incompatible ou incertain.",
  "experienceOk et missionsOk sont des booléens.",
  "motifs est un tableau de phrases courtes. analyse est un paragraphe en français.",
  "contrat vaut CDI, CDD, VIE, Stage, Alternance, Freelance ou Non précisé.",
  "Règles :",
  "- Incompatible si le titre est senior, lead, staff, principal, head of, directeur, engineering manager, VP, CTO ou responsable d'équipe.",
  "- Incompatible si l'expérience demandée est un minimum d'au moins 3 ans, un « 3+ », un « plus de 3 ans », ou une fourchette dont le maximum dépasse 3 ans (3-5, 2-4).",
  "- « Jusqu'à 3 ans », « 0-2 ans » et « 1-3 ans » restent acceptables pour l'expérience.",
  "- Un « 3 ans » isolé, ou les mots confirmé et expert, ne suffisent pas à rejeter : decision = limite si le métier colle.",
  "- Incompatible si le contrat est un stage, une alternance ou du freelance.",
  "- CDI, CDD, VIE et graduate program sont acceptés. Les ESN et le conseil aussi, si le métier colle.",
  "- Incompatible si un doctorat est exigé. Un doctorat indiqué comme simple atout ne rejette pas.",
  "- missionsOk = true seulement si le poste touche à l'IA, à la data, au logiciel ou au développement.",
  "- Pas de filtre sur la ville ni le pays.",
  "- compatible seulement si l'expérience, les missions et le contrat conviennent, et que le texte suffit à le voir.",
  "- incertain si la page est illisible et que le mail ne permet pas de trancher. N'invente ni l'entreprise, ni les années, ni le contrat.",
].join('\n');

function extraireJson(content) {
  const text = String(content || '').trim();
  if (!text) throw new Error('Réponse Mistral vide');
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSON absent de la réponse Mistral');
  return JSON.parse(raw.slice(start, end + 1));
}

function contenuMessage(reponse) {
  if (!reponse) throw new Error('Réponse Mistral absente');
  if (typeof reponse === 'string') {
    try {
      return contenuMessage(JSON.parse(reponse));
    } catch {
      return reponse;
    }
  }
  return reponse.choices?.[0]?.message?.content
    || reponse.content
    || '';
}

function corpsMistral(offre) {
  const utilisateur = [
    `Titre vu dans le mail : ${offre.titre || ''}`,
    `Source : ${offre.source || ''}`,
    `Lien : ${offre.lien || ''}`,
    `Lecture de la page : ${offre.lecture || 'mail seul'}`,
    `Sujet du mail : ${offre.sujet || ''}`,
    '',
    'Texte de la page :',
    offre.texteOffre || '(page illisible ou absente)',
    '',
    'Extrait du mail :',
    offre.extrait || '(vide)',
  ].join('\n');

  return {
    model: 'mistral-small-latest',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEME },
      { role: 'user', content: utilisateur },
    ],
  };
}

function lireReponseMistral(reponse) {
  const data = extraireJson(contenuMessage(reponse));
  const decisions = ['compatible', 'limite', 'incompatible', 'incertain'];
  const decision = decisions.includes(data.decision) ? data.decision : 'incertain';
  return {
    decision,
    anneesDemandees: data.annees ? String(data.annees) : '',
    experienceOk: Boolean(data.experienceOk),
    missionsOk: Boolean(data.missionsOk),
    contrat: data.contrat ? String(data.contrat) : '',
    titre: data.titre ? String(data.titre) : '',
    entreprise: data.entreprise ? String(data.entreprise) : '',
    localisation: data.localisation ? String(data.localisation) : '',
    motifsIa: Array.isArray(data.motifs) ? data.motifs.map(String) : [],
    analyse: data.analyse ? String(data.analyse) : '',
  };
}

function fusionnerReponse(offre, lu) {
  return {
    ...offre,
    decision: lu.decision,
    anneesDemandees: lu.anneesDemandees || offre.anneesDemandees || '',
    experienceOk: lu.experienceOk,
    missionsOk: lu.missionsOk,
    contrat: lu.contrat || offre.contratPage || offre.contrat || '',
    titre: lu.titre || offre.titre,
    entreprise: lu.entreprise || offre.entreprisePage || offre.entreprise || '',
    localisation: lu.localisation || offre.localisationPage || offre.localisation || '',
    motifs: [...(offre.motifs || []), ...lu.motifsIa],
    motifsIa: lu.motifsIa,
    analyse: lu.analyse,
  };
}

module.exports = {
  corpsMistral,
  lireReponseMistral,
  fusionnerReponse,
  extraireJson,
  contenuMessage,
};
