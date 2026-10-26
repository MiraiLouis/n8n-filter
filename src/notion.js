function texteRiche(valeur, max) {
  const contenu = String(valeur || '').slice(0, max || 1900);
  if (!contenu) return { rich_text: [] };
  return { rich_text: [{ type: 'text', text: { content: contenu } }] };
}

function texteRicheLong(valeur) {
  const contenu = String(valeur || '').slice(0, 19000);
  if (!contenu) return { rich_text: [] };
  const blocs = [];
  for (let i = 0; i < contenu.length && blocs.length < 10; i += 1900) {
    blocs.push({ type: 'text', text: { content: contenu.slice(i, i + 1900) } });
  }
  return { rich_text: blocs };
}

function selection(nom) {
  return nom ? { select: { name: nom } } : { select: null };
}

function dateNotion(valeur) {
  const debut = String(valeur || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(debut)) return { date: null };
  return { date: { start: debut } };
}

function urlNotion(lien) {
  if (!lien || !/^https?:\/\//i.test(lien)) return { url: null };
  return { url: lien };
}

function statutNotion(offre) {
  if (offre.rejetEvident || offre.decision === 'rejetee') return 'Rejetée (règles)';
  if (offre.decision === 'compatible') return 'À postuler';
  if (offre.decision === 'limite') return 'Limite';
  if (offre.decision === 'incompatible') return 'Rejetée (IA)';
  return 'À vérifier';
}

function decisionNotion(offre) {
  if (offre.rejetEvident || offre.decision === 'rejetee') return 'rejetée';
  if (['compatible', 'limite', 'incompatible', 'incertain'].includes(offre.decision)) return offre.decision;
  return 'incertain';
}

function lectureNotion(offre) {
  if (offre.lecture === 'complète' || offre.lecture === 'mail seul') return offre.lecture;
  if (!offre.lien || offre.rejetEvident) return 'mail seul';
  return 'complète';
}

function contratNotion(offre) {
  const brut = String(offre.contrat || offre.contratPage || '').trim().toLowerCase();
  const table = {
    cdi: 'CDI',
    cdd: 'CDD',
    vie: 'VIE',
    stage: 'Stage',
    alternance: 'Alternance',
    freelance: 'Freelance',
    'graduate program': 'VIE',
    graduate: 'VIE',
  };
  if (table[brut]) return table[brut];
  if (brut.includes('altern')) return 'Alternance';
  if (brut.includes('stage') || brut.includes('intern')) return 'Stage';
  if (brut.includes('free') || brut.includes('portage')) return 'Freelance';
  if (brut.includes('vie') || brut.includes('graduate')) return 'VIE';
  if (brut.includes('cdd') || brut.includes('temporary')) return 'CDD';
  if (brut.includes('cdi') || brut.includes('full')) return 'CDI';
  const motifs = (offre.motifs || []).join(' ').toLowerCase();
  if (motifs.includes('alternance')) return 'Alternance';
  if (motifs.includes('freelance')) return 'Freelance';
  if (motifs.includes('stage')) return 'Stage';
  return 'Non précisé';
}

function experienceCoche(offre) {
  if (typeof offre.experienceOk === 'boolean' && !offre.rejetEvident) return offre.experienceOk;
  const motifs = (offre.motifs || []).join(' ');
  if (/Expérience demandée|Titre senior/.test(motifs)) return false;
  return offre.decision === 'compatible' || offre.decision === 'limite';
}

function missionsCoche(offre) {
  if (typeof offre.missionsOk === 'boolean' && !offre.rejetEvident) return offre.missionsOk;
  const motifs = (offre.motifs || []).join(' ');
  if (motifs.includes('Hors IA')) return false;
  return offre.decision === 'compatible' || offre.decision === 'limite';
}

function corpsNotion(offre, databaseId) {
  const titre = offre.titre || offre.sujet || 'Offre sans titre';
  const empreinte = `${offre.messageId || ''}|${offre.lien || titre}`;
  const analyse = offre.analyse || '';
  const extrait = offre.extrait || String(offre.texteOffre || '').slice(0, 500);
  return {
    parent: { database_id: databaseId || 'COLLER_ID_BASE_OFFRES' },
    properties: {
      Offre: { title: [{ type: 'text', text: { content: String(titre).slice(0, 180) } }] },
      Entreprise: texteRiche(offre.entreprise || offre.entreprisePage || ''),
      Source: selection(offre.source || 'Site carrière'),
      Lien: urlNotion(offre.lien),
      'Date mail': dateNotion(offre.dateMail),
      Statut: selection(statutNotion(offre)),
      Décision: selection(decisionNotion(offre)),
      'Années demandées': texteRiche(offre.anneesDemandees || ''),
      'Expérience OK': { checkbox: experienceCoche(offre) },
      'Missions OK': { checkbox: missionsCoche(offre) },
      Motifs: texteRiche((offre.motifs || []).join('\n')),
      Analyse: texteRiche(analyse),
      Extrait: texteRiche(extrait),
      Contrat: selection(contratNotion(offre)),
      Localisation: texteRiche(offre.localisation || offre.localisationPage || ''),
      Empreinte: texteRiche(empreinte),
      'Sujet mail': texteRiche(offre.sujet || ''),
      Lecture: selection(lectureNotion(offre)),
      CV: texteRiche(''),
    },
  };
}

module.exports = {
  corpsNotion,
  texteRiche,
  texteRicheLong,
  statutNotion,
  contratNotion,
};
