# Roadmap

Last updated: 2026-03-26

This file is the execution source of truth.

## Status legend

- `Done`: implemented in code and currently active.
- `In progress`: partially complete or blocked by cleanup.
- `Planned`: not started.

## Milestones

| Milestone                             | Status      | Scope                                                                       | Completion criteria                                                                               |
| ------------------------------------- | ----------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| M1 - Runtime public content API       | Done        | `/api/posts`, `/api/post`, public viewer integration                        | Public posts load from private content repo without build-generated content in this repo          |
| M2 - Runtime protected content API    | Done        | `/api/protected-posts`, `/api/protected-post`, protected viewer integration | Protected metadata and post content load through functions with server-side password verification |
| M3 - Shared parsing/loading utilities | Done        | `_lib` helpers + `js/post-common.js`                                        | Common parsing, CORS, TOC, dynamic component loading, and loader behavior are centralized         |
| M4 - Legacy pipeline cleanup          | In progress | Remove outdated build-era config                                            | No references to missing `build.js`; CI/workflow reflects runtime architecture                    |
| M5 - Release metadata alignment       | In progress | Versioning and docs consistency                                             | Package/app versioning and changelog entries are synchronized                                     |
| M6 - RSS feed support                 | Planned     | Add feed generation/endpoint                                                | RSS endpoint and validation in place                                                              |
| M7 - JS/CSS consolidation pass        | Planned     | Reduce remaining duplication and inline styles                              | Duplicated logic/styles are removed without behavior regressions                                  |

## Current focus (active)

1. M4 - Legacy pipeline cleanup.
2. M5 - Release metadata alignment.

## Deferred until after cleanup

1. M6 - RSS support.
2. M7 - JS/CSS consolidation.
