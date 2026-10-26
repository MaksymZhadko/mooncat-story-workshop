# OOC browser checkpoint sync

Use **Browser sync** in the workshop during an active assistant/browser session. This is an explicit checkpoint handoff, not a background OOC connection or autonomous player.

1. Open OOC My Titles or a specific existing episode in the active browser. An assistant reads only the displayed page and records its exact source URL, capture time and coverage limits.
2. The assistant produces an `ooc-browser-checkpoint` JSON packet. Paste it into **Browser sync → OOC checkpoint JSON → Merge checkpoint**.
3. A title-list scan updates the local catalogue. A session capture is associated with an existing run only if its exact episode URL matches. Same-title runs are kept separate.
4. Review new evidence against the canonical state and report any contradiction. A capture is not proof of full history or a completed review, and does not update canon automatically.
5. After each played scene, capture again. Save explicitly on the device and export a private backup. Nothing is continuously monitored after the assistant/browser session ends.

The workshop page does not read OOC cookies, credentials, private APIs or other tabs. It does not click Continue, submit story turns, spend credits or publish private captures. An active assistant may operate the OOC UI when the user directs a playtest. Story choice and actions still belong to the user.

Accepted packet shape:

```json
{
  "schemaVersion": 1,
  "kind": "ooc-browser-checkpoint",
  "captureType": "catalog",
  "sourceUrl": "https://ooc.ai/my-title",
  "capturedAt": "2026-01-01T00:00:00Z",
  "coverage": "Visible title listing only",
  "titles": []
}
```

For `story` or `session` captures, use the exact canonical OOC story or episode URL and supply `title`, `visibleText` and `coverage`. Do not include account credentials, tokens, hidden application state or unrelated history. The capture time is a real-world observation time, not the fictional story clock.

Older captures cannot replace the latest capture for the same page. Unchanged captures are deduplicated. Full backups preserve the catalogue and checkpoint history. Public story exports exclude both.
