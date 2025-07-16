# Repository Configuration Guide

This document outlines the recommended GitHub repository settings for enhanced security and workflow management.

## Branch Protection Rules

### Main Branch Protection
Configure the following settings for the `main` branch in GitHub repository settings:

1. **Go to**: Repository → Settings → Branches → Add rule
2. **Branch name pattern**: `main`
3. **Enable the following restrictions**:

#### Protect matching branches
- [x] Restrict pushes that create files larger than 100 MB
- [x] Restrict pushes that create files larger than 100 MB

#### Require a pull request before merging
- [x] Required
- [x] Require approvals: **1**
- [x] Dismiss stale PR approvals when new commits are pushed
- [x] Require review from code owners
- [x] Restrict pushes that create files larger than 100 MB
- [ ] Allow specified actors to bypass required pull requests (Only for repository owners)

#### Require status checks to pass before merging
- [x] Required
- [x] Require branches to be up to date before merging
- **Required status checks**:
  - `test`
  - `build`
  - `pr-validation`
  - `security-check`

#### Require conversation resolution before merging
- [x] Required

#### Require signed commits
- [x] Required (Optional but recommended)

#### Require linear history
- [x] Required

#### Require deployments to succeed before merging
- [ ] Not required for this project

#### Lock branch
- [ ] Not required

#### Do not allow bypassing the above settings
- [x] Include administrators (Recommended)

### Additional Branch Rules
Create additional rules for:
- `develop`: Same as main but allow direct pushes from maintainers
- `feature/*`: Require PR before merging
- `hotfix/*`: Allow fast-forward merges

## Repository Settings

### General Settings
- **Repository name**: vscode-mcp
- **Description**: Full-featured coding agent MCP server for VS Code with Python, JavaScript, and Git support
- **Website**: (Add your documentation URL)
- **Topics**: `vscode`, `mcp`, `coding-agent`, `typescript`, `automation`

### Features
- [x] Issues
- [x] Projects
- [x] Preserve this repository
- [x] Wiki
- [x] Discussions
- [x] Sponsorships

### Pull Requests
- [x] Allow merge commits
- [x] Allow squash merging
- [x] Allow rebase merging
- [x] Always suggest updating pull request branches
- [x] Allow auto-merge
- [x] Automatically delete head branches

### Security Settings
- [x] Private vulnerability reporting
- [x] Dependency graph
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Code scanning

### Webhook Events (for CI/CD)
Configure webhooks for:
- Push events
- Pull request events
- Release events
- Issue events

## Deployment Keys
Add deployment keys for:
- CI/CD systems
- Package registries
- Documentation deployment

## Secrets and Variables

### Repository Secrets
Add the following secrets in Settings → Secrets and variables → Actions:

- `CODECOV_TOKEN`: For code coverage reporting
- `NPM_TOKEN`: For publishing to npm (if applicable)
- `DOCKER_HUB_TOKEN`: For Docker image publishing

### Repository Variables
Add the following variables:

- `NODE_VERSION`: `20.x`
- `PNPM_VERSION`: `8`

## Team Permissions
Configure team access:
- **Admins**: @braincraft, @Asif1405
- **Maintainers**: Repository owners
- **Contributors**: Write access after first merged PR

## Automated Security
Configure GitHub Advanced Security:
- Code scanning with CodeQL
- Secret scanning
- Dependency review
- License detection

## Notifications
Configure notification settings for:
- Failed CI builds
- Security alerts
- New issues/PRs
- Releases

---

## Quick Setup Commands

Run these commands to apply repository settings via GitHub CLI:

```bash
# Install GitHub CLI if not already installed
brew install gh

# Authenticate
gh auth login

# Create branch protection rule for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --input protection-rules.json

# Enable vulnerability alerts
gh api repos/:owner/:repo \
  --method PATCH \
  --field has_vulnerability_alerts=true

# Enable automated security fixes
gh api repos/:owner/:repo \
  --method PATCH \
  --field allow_auto_merge=true
```

## Manual Configuration Required
Some settings must be configured manually in the GitHub web interface:
1. Branch protection rules
2. Security settings
3. Team permissions
4. Webhook configurations
5. Deploy keys
