# Projects and title progress

The Projects & titles view groups OOC runs by source story ID and indexes project chats by stable ID. Identically named chats remain separate. Authored OOC titles appear first. Project and title tabs support search and progress filtering.

Each title has independent Review, Canon, Test drive and Revision stages, a version, evidence reference, current checkpoint and next action. Statuses are Not started, In progress, Blocked, Done and Not applicable. Progress excludes Not applicable stages. Changes retain a timestamped before/after history. Work status never upgrades session review coverage or release approval.

Private workspace JSON preserves projects, projectChats, workProgress and progressLog. Older schema-1 backups remain supported. A `project-workshop-index` packet merges project metadata and chat links while preserving session records and work progress. Packets require matching canonical ChatGPT project and chat URLs. Older indexes are rejected. Missing entries in an updated index are retained, not silently deleted.

The public shell contains no project IDs, private chat links, manuscripts or checkpoint data. Use a private import on each device, explicit device saves, and exported backups. Project handoff export is private Markdown. This is not a live ChatGPT/OOC connection or background monitor. The website cannot read other tabs or submit gameplay turns.
