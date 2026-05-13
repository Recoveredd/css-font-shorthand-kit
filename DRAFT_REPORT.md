# DRAFT REPORT: css-font-shorthand-kit

## Verdict

GO local uniquement. Brouillon à relire humainement avant toute décision de publication.

## Candidat repris comme signal

- Package abandonné observé: `cssfontparser`
- Signal d'usage: npm.io indique environ 545 832 téléchargements hebdomadaires, 19 dépendants, version 1.2.1.
- Signal d'abandon: npm.io indique une dernière publication il y a 11 ans.
- Licence de l'ancien package: MIT.
- Clean-room: aucun code, README ou test de l'ancien package n'a été repris. Le brouillon repart d'une API et d'une implémentation neuves.

## Score anti-emballement

- Usage actuel vérifié: 2/2. Le volume hebdomadaire est élevé pour une surface aussi étroite.
- Abandon ou maintenance faible: 2/2. Dernière publication indiquée il y a 11 ans.
- Scope livrable en 1 journée: 2/2. Une V0 limitée au shorthand CSS `font` tient dans une petite API.
- Douleur utilisateur visible: 2/2. Les outils canvas/CSS ont besoin d'extraire taille, hauteur de ligne et familles sans embarquer un parseur CSS complet.
- Différenciation non triviale: 2/2. Diagnostics structurés, erreurs non jetées, familles citées/échappées, API strictement typée et zéro dépendance runtime.

Score total: 10/10.

## Différenciation en 1 journée

`css-font-shorthand-kit` parse le shorthand CSS `font` en résultat typé avec diagnostics structurés et sérialisation minimale, pour aider les outils de design/canvas à expliquer les valeurs invalides sans dépendre d'un parseur CSS complet.

## Concurrents vérifiés

- `css-font-parser`: package maintenu récemment, 0 dépendance, environ 7k à 24k téléchargements hebdomadaires selon les index. Bon parseur général.
- `css-font`: dernière publication ancienne, environ 95k téléchargements hebdomadaires, parse et stringify, mais avec plusieurs dépendances runtime.
- `parse-css-font`: dernière publication ancienne, environ 28k téléchargements hebdomadaires, parse le shorthand.
- `postcss-minify-font-values`: très maintenu et massif, mais c'est un plugin PostCSS de minification, pas une micro-lib de diagnostic.

Raison du GO malgré `css-font-parser`: le brouillon ne cherche pas à remplacer le leader maintenu. Il se limite à une API de résultat explicite avec diagnostics et formatage, utile dans des UIs/outils qui ne veulent pas d'exception ni de PostCSS.

## Nom retenu

`css-font-shorthand-kit`

Justification: nom explicite, descriptif, cohérent avec les noms en `*-kit`, compréhensible immédiatement dans npm/GitHub. Il indique le domaine (`css-font`), l'action/surface (`shorthand`) et le format Recoveredd (`kit`). Les recherches web rapides n'ont pas montré de package existant portant exactement ce nom.

## Compatibilité navigateur

Le coeur utilise uniquement des chaînes, tableaux, objets, `Set` et expressions régulières. Il n'utilise pas `fs`, `path`, `node:url`, `Buffer`, `process`, module natif, ni accès réseau implicite. Aucune dépendance runtime.

## CLI

Pas de CLI retenue. Le besoin naturel est une fonction embarquée dans des outils CSS/canvas/design; une CLI ajouterait du bruit sans usage évident.

## API proposée

- `parseFontShorthand(input, options?)`
- `tryParseFontShorthand(input, options?)`
- `parseFontFamilyList(input)`
- `formatFontShorthand(value)`
- Types exportés: `FontShorthand`, `SystemFontShorthand`, `FontDiagnostic`, `ParseFontResult`, `ParseFontOptions`.

## Risques et limites

- Ce n'est pas un parseur CSS complet.
- Les fonctions `calc()` et `var()` sont acceptées comme jetons de taille simples, sans validation interne.
- Les mots-clés et unités CSS récents doivent être revus avant publication.
- Il faudra comparer davantage avec `css-font-parser` pour éviter une promesse trop proche.

## Ce qui manque avant publication

- Revue humaine du scope et du nom.
- Ajout éventuel de cas CSS officiels tirés de MDN, réécrits en tests propres.
- Benchmark très simple face aux cas fréquents canvas.
- Décision sur la compat exacte des system fonts et des valeurs globales CSS.

## État Git local

- `git init`: OK dans le dossier du brouillon.
- `git branch -M main`: a signalé un échec de verrou `HEAD.lock` refusé par le sandbox, mais Git a ensuite affiché le commit sur `main`.
- `git config user.name "Recoveredd"` et `git config user.email "recoveredd@users.noreply.github.com"`: OK.
- `git add .` et `git commit -m "Create css-font-shorthand-kit draft"`: OK, commit local `d4a174d`.
- Aucun remote ajouté.

## Validations locales

- `npm install`: OK. npm signale 4 vulnérabilités modérées dans les dépendances de développement installées.
- `npm run typecheck`: OK.
- `npm test`: OK, 10 tests passent.
- `npm run build`: OK.
- `npm pack --dry-run`: premier essai bloqué par l'écriture de logs npm hors workspace; deuxième essai OK avec `npm_config_cache=.npm-cache`.
