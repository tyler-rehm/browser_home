# Spec Delta

## ADDED Requirements

### Requirement: Release checklist includes Ask models Safari gates
The release checklist SHALL list Ask models Safari verification as separate manual gates from Chromium/WebKit CI, including service update, Model accounts in shipping Safari, and one Ask models run. Those gates SHALL remain unchecked until a human records the date and observation.

#### Scenario: Ask models is part of a release cut
- **WHEN** a contributor prepares a release that includes Ask models
- **THEN** the release checklist shows Ask models Safari gates as open until a human records them
