# lazyprs

A CLI tool to create pull requests from a selection of commits, making it easy to split up work into smaller, more focused PRs.

## Installation

```bash
# Use directly with npx/pnpm dlx
pnpm dlx @rafael79/lazyprs big-branch-name
```

## Usage

```bash
pnpm dlx @rafael79/lazyprs <base-branch> [options]
```

### Examples

```bash
# Basic usage - create PR against big-branch-name branch
pnpm dlx @rafael79/lazyprs big-branch-name

# Custom branch name
pnpm dlx @rafael79/lazyprs big-branch-name --branch=feature-xyz

# Custom PR title
pnpm dlx @rafael79/lazyprs big-branch-name --title="Fix navigation issues"

# Create as PR in draft mode
pnpm dlx @rafael79/lazyprs big-branch-name --draft

# Keep local branch after PR creation
pnpm dlx @rafael79/lazyprs big-branch-name --keep

# Specify custom starting point for commit range
pnpm dlx @rafael79/lazyprs big-branch-name --from v1.2.3

# Ignore PR template
pnpm dlx @rafael79/lazyprs big-branch-name --ignore-templates
pnpm dlx @rafael79/lazyprs big-branch-name --ignore-templates --body "This PR fixes several issues with the navigation component."
```

The tool will:

1. Create a new branch from the specified base
2. Present an interactive prompt to select commits to include
3. Cherry-pick selected commits to the new branch
4. Push to remote and create a PR
5. Clean up the local branch (unless --keep is specified)
