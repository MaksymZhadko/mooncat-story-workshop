# Moon Cat Story Workshop

A local-first workshop for continuity, campaign memories, resources, narrative testing and release preparation. The public website is an empty tool shell. Private play history is imported on your device.

## Start now

Open the published workshop, then choose **New story** or **Import workshop JSON**. If you have the personal download package, import `private/audit.json` locally. The separate personal HTML contains private data and must not be published. Use **Save on this device** explicitly, then **Export private backup** after important edits. Imported files are not uploaded. There is no automatic cloud sync, account connection or AI generation service.

Private packages may include a workbook and audit JSON. Review coverage is stated per session. Blank review fields do not mean a story passed.

Read the generic [workflow](docs/WORKFLOW.md). Personal guides, project instructions and critique belong under `private/` and must stay outside a public repository.

## Publish the tool with GitHub Pages

1. Create or reuse a repository under your own account. Publishing remains a separate step from storing code.
2. Upload **only** `site/`, `tests/`, `.github/`, `.gitignore`, `package.json`, `README.md` and `docs/`. Review the staged file list. Never upload the entire ZIP or `private/`. `.gitignore` does not protect files manually uploaded through GitHub's website, or files already committed.
3. In repository **Settings → Pages**, choose **GitHub Actions** as the publishing source.
4. Run the **Publish workshop shell** workflow manually. It tests and deploys only `site/`. Public hosting was approved; the repository is public and the deployment workflow is installed.
5. Use the Pages URL reported by GitHub. No guessed live URL is supplied here.

The Pages workflow has manual dispatch only. Changing data locally never changes the hosted shell. GitHub Pages is public web hosting in the usual configuration, including many private-repository setups. It is not your private manuscript database. Keep the private backup outside the public repository, optionally in a separate private repository with access you control.

## Tests

`npm test` uses Node's built-in test runner. `npm run check` checks JavaScript syntax. There are no package dependencies and no install step. Tests cover structured time, identity, resource and completion checks; branch isolation; release prerequisites; and exclusion of private material from public exports. They do not read free-form fiction or establish that a whole story is bug-free.

## Reference storage

Use a branch-specific canonical state plus append-only events. Facts keep evidence references, uncertainty and history. A retcon is a separate proposal; adding it does not silently rewrite events. Resource current values derive from opening + gained − spent. Backups are portable versioned JSON, not screenshots.

The app blocks duplicate IDs, supports structured state additions, issue statuses, actual playtest results and release records. It does not automatically reconcile prose or verify rights. Public export permits only approved session ID, title and synopsis after required records are complete. It omits private memories, source links, critiques and event history.

## Rights

No blanket license is granted to imported scenarios, artwork, characters or AI outputs. See the guide's rights section. Your original human-authored additions and third-party source material must be tracked separately. The package contains short editorial summaries rather than raw transcripts.
