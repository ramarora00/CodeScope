# Git Workflow

## Main Branch
The main branch is the absolute source of truth. It must always be in a deployable state. Direct commits to main are strictly forbidden.

## Feature Branches
All development happens on feature branches. They should branch off main and be kept up to date with main via git rebase.

## Branch Naming Convention
- eature/ - New features
- ugfix/ - Fixing bugs
- chore/ - Maintenance, dependencies
- docs/ - Documentation updates
- efactor/ - Refactoring existing code

## Commit Message Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/).
Format: <type>(<scope>): <subject>

## Merge Strategy
- Pull Requests must be approved before merging.
- **Squash and Merge** is the preferred strategy to keep the main history linear and clean.

## Release Strategy
Releases are tagged on the main branch using Semantic Versioning (X.Y.Z). See [Release Strategy](ReleaseStrategy.md) for specifics.
