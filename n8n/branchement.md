# Brancher le filtre d'offres dans n8n

Les fichiers `01` à `07` se collent chacun dans un nœud **Code**. Tu crées toi-même les nœuds Gmail, HTTP et Notion. Le workflow reste inactif le temps d'un essai manuel sur un seul mail.

Gmail déclenche sur le libellé `offres`. Pose ce libellé sur les alertes LinkedIn, Indeed, Apec, Glassdoor, Welcome to the Jungle et les mails des sites carrières. Un mail qui contient plusieurs offres est découpé : une ligne par lien. Le lien est ouvert, les règles dures tranchent les rejets évidents, Mistral lit le reste, et chaque offre finit dans Notion. Pour une offre compatible ou limite, un second appel Mistral rédige un CV texte dans la propriété CV.

## Bases Notion

Crée deux bases et partage-les avec ton intégration Notion.

Base **Offres**, propriétés exactement sous ces noms :

- Offre : titre
- Entreprise : texte
- Source : sélection. Options : `LinkedIn`, `Indeed`, `Apec`, `Glassdoor`, `Welcome to the Jungle`, `Site carrière`
- Lien : URL
- Date mail : date
- Statut : sélection. Options : `Rejetée (règles)`, `Rejetée (IA)`, `À postuler`, `Limite`, `À vérifier`
- Décision : sélection. Options : `compatible`, `limite`, `incompatible`, `rejetée`, `incertain`
- Années demandées : texte
- Expérience OK : case à cocher
- Missions OK : case à cocher
- Motifs : texte
- Analyse : texte
- Extrait : texte
- Contrat : sélection. Options : `CDI`, `CDD`, `VIE`, `Stage`, `Alternance`, `Freelance`, `Non précisé`
- Localisation : texte
- Empreinte : texte
- Sujet mail : texte
- Lecture : sélection. Options : `complète`, `mail seul`
- CV : texte

L'identifiant de la base est dans son URL, les 32 caractères après le nom de la page et avant le `?`. Colle-le à la place de `COLLER_ID_BASE_OFFRES` dans `06-corps-notion.js`.

Base **Compétences** :

- Compétence : titre
- Type : sélection. Options : `technique`, `experience`, `formation`, `langue`, `projet`, `publication`
- Texte : texte
- Mots-clés : texte

Une ligne = un bloc réutilisable du CV (un stage, un projet, une compétence). Tant que cette base est vide, le script CV utilise le profil déjà écrit dans `07-prompt-cv.js`.

## Identifiants

Trois credentials :

- **Gmail OAuth2**, sur le déclencheur et sur le nœud qui marque le mail comme lu.
- **Header Auth** nommé pour Mistral. Nom de l'en-tête : `Authorization`. Valeur : `Bearer` suivi de ta clé API.
- **Header Auth** pour Notion, même champ `Authorization` avec `Bearer` et le jeton d'intégration. Sur chaque nœud HTTP Notion, ajoute en plus l'en-tête `Notion-Version` avec la valeur `2022-06-28`.

## Ordre des nœuds

1. **Gmail Trigger**. Credential Gmail. Événement : message reçu. Simplify : désactivé. Filtre Search : `label:offres is:unread`. Read status : unread. Poll : toutes les 15 minutes, ou une heure. Sans Simplify désactivé, le mail n'a pas de corps HTML.
2. **Code** `01-decouper-offres.js`. Mode : Run Once for All Items.
3. **Code** `02-regles.js`. Mode : Run Once for Each Item.
4. **IF** `Rejet évident`. Valeur : `{{ $json.rejetEvident }}`. Opération : is true (booléen).
5. Branche vrai : **Code** `06-corps-notion.js`, puis **HTTP Notion** pour créer la page.
6. Branche faux : **IF** `Lien présent`. Valeur : `{{ $json.lien }}`. Opération : is not empty.
7. Lien présent : **HTTP** ouvrir le lien, puis **Code** `03-lire-page.js`.
8. Lien absent : **Code** `03-lire-page.js` directement. `pageHtml` manque, la lecture devient `mail seul`.
9. Les deux sous-branches rejoignent **Code** `04-prompt-mistral.js`, puis **HTTP Mistral**, puis **Code** `05-lire-reponse-mistral.js`, puis **Code** `06-corps-notion.js`, puis **HTTP Notion**.
10. Après la création Notion, **IF** `CV`. Valeur : `{{ $json.decision }}`. Opération : is equal to, et une seconde condition combinée en OU : `compatible` ou `limite`. Le plus simple : une expression booléenne `{{ ['compatible', 'limite'].includes($json.decision) }}` is true.
11. Branche CV : **HTTP** interroger les compétences, **Code** `07` en mode `prompt`, **HTTP Mistral**, **Code** `07` en mode `patch`, **HTTP** mettre à jour la page.
12. **Gmail** marquer comme lu, sur les deux branches du rejet, après l'écriture Notion. Message ID : `{{ $json.messageId }}`.

## Ouvrir le lien

Nœud HTTP Request, méthode GET. URL : `{{ $json.lien }}`.

- En-tête `User-Agent` : `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36`
- En-tête `Accept-Language` : `fr-FR,fr;q=0.9`
- Options, redirection : suivre les redirections.
- Options, réponse : format texte, et **Put Output in Field** = `pageHtml`. Sans ce champ, la réponse efface l'offre.
- Timeout : 20000.
- Réglage du nœud : On Error = Continue. Une page qui échoue ne doit pas arrêter les autres offres.

Le script lit le bloc `JobPosting` quand la page en a un, sinon le texte visible. Une page de connexion (souvent LinkedIn ou Glassdoor) donne `lecture: mail seul` et Mistral s'appuie sur l'extrait du mail.

## Appel Mistral

HTTP Request, POST, URL `https://api.mistral.ai/v1/chat/completions`. Credential Header Auth Mistral.

- Body : JSON. Contenu : `{{ $json.mistralBody }}` pour l'analyse, `{{ $json.mistralCv }}` pour le CV.
- Put Output in Field : `reponseMistral` pour l'analyse, `reponseCv` pour le CV.
- Timeout : 60000.
- On Error : Continue.

Le modèle écrit dans les scripts est `mistral-small-latest`.

## Écrire dans Notion

Créer la page : POST `https://api.notion.com/v1/pages`. Credential Notion, plus l'en-tête `Notion-Version: 2022-06-28`. Body JSON : `{{ $json.corpsNotion }}`. Put Output in Field : `pageNotion`. On Error : Continue.

Interroger les compétences : POST `https://api.notion.com/v1/databases/COLLER_ID_BASE_COMPETENCES/query`. Body JSON : `{ "page_size": 100 }`. Put Output in Field : `resultatsCompetences`.

Le fichier `07-prompt-cv.js` sert deux fois. Colle-le dans deux nœuds Code.

- Avant Mistral, laisse `const MODE = 'prompt';`
- Après Mistral, dans le second nœud, remplace par `const MODE = 'patch';`

Mettre à jour le CV : PATCH `https://api.notion.com/v1/pages/{{ $json.patchCv.pageId }}`. Body JSON : `{{ $json.patchCv.body }}`. Même en-tête `Notion-Version`.

## Ce que les règles rejettent seules

Sans Mistral : titre senior ou équivalent (senior, lead, staff, principal, head of, directeur, engineering manager, VP, CTO, responsable d'équipe), expérience au-delà de 3 ans (`3 ans minimum`, `au moins 3 ans`, `3+`, `plus de 3 ans`, fourchette dont le max dépasse 3), stage, alternance, freelance, doctorat exigé, texte qui ne touche ni à l'IA, ni à la data, ni au logiciel, ni au développement.

`Confirmé`, `expert` et un `3 ans` isolé partent à Mistral. `Jusqu'à 3 ans`, `0-2 ans` et `1-3 ans` aussi, s'il n'y a pas d'autre rejet. Pas de filtre sur le lieu. CDI, CDD, VIE, graduate programs et ESN passent cette étape.

## Essai

Envoie-toi un mail d'alerte, ajoute le libellé `offres`, laisse-le non lu, puis exécute le workflow à la main. Vérifie trois cas : un rejet de règles dans Notion, une offre ouverte jusqu'au texte de la page, et un CV sur une offre compatible. Active le workflow ensuite. Le mail est marqué lu seulement après l'écriture Notion : s'il reste non lu, la création a échoué et le prochain poll le reprendra.
