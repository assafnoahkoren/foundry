# GitHub Actions Workflows

This project uses GitHub Actions for continuous integration and dependency monitoring.

## Workflows

### 1. CI (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests, Manual dispatch

**What it does:**
- ✅ Installs dependencies for the monorepo
- ✅ Runs TypeScript type checking for both server and webapp
- ✅ Runs ESLint for code quality
- ✅ Sets up PostgreSQL database for tests
- ✅ Runs all tests with coverage reporting
- ✅ Builds the webapp to ensure it compiles

**When to use:** This runs automatically on every push and PR. It ensures code quality and that all tests pass.

### 2. Dependency Check (`dependency-check.yml`)
**Triggers:** Weekly (Mondays 9 AM UTC), Manual dispatch

**What it does:**
- 📦 Checks for outdated npm packages
- 🔒 Runs security audit on dependencies
- 📋 Creates GitHub issues if vulnerabilities are found

**When to use:** This helps maintain security by monitoring dependencies for known vulnerabilities.

## Running Workflows Manually

You can manually trigger workflows from the Actions tab in GitHub:
1. Go to the Actions tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Required Secrets

No additional secrets are required. The workflows use the default `GITHUB_TOKEN` which is automatically provided.

## Environment Variables

The CI workflow uses these environment variables (defined in `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens (test value in CI)
- `JWT_EXPIRATION`: JWT token expiration time