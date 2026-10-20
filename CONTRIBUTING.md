# Contributing to Retro Rewind Website

Pull requests should explain what they do and what they edit. Start the description with a high-level explanation of the change and why it is needed.

## Adding New Features

Before you start adding a new feature, make sure you understand:

1. **No guarantees:** Your feature is not guaranteed to be merged into the website.
2. **Functionality is desired:** The feature should improve the site for the community. Think a bug fix or a highly requested feature. If you are unsure, open an issue first and ask.
3. **Useful PRs:** Your PR should consist of reusable, extendable code that helps future work and other developers.
4. **No exclusive ownership:** Submitting a PR does not give you exclusive control over the feature. We may reimplement it any way we see fit if the PR does not meet the standards or the requirements change.
5. **Useful comments:** Comment your code to explain its purpose and the reasoning behind it. Comments should explain the decisions behind the code, not restate what it does.

## Pull Request Guidelines

### Title

Use a short, clear title that describes the change. There is no required prefix, but `fix:` and `feature:` are welcome if you like them.

### Description

Please include these sections in your PR description:

- A high-level explanation of what the PR does and why.
- What you changed. Not line by line, but in general.

## Before You Submit

Run the checks that match the area you changed.

**Frontend** (from `Frontend/`):

```bash
npm run lint
npm run type-check
npm run build
npm run test
```

**Backend** (from `Backend/`):

```bash
dotnet build
dotnet format RetroRewindWebsite.csproj --verify-no-changes
```

**Tests** (from the repo root):

```bash
dotnet test Backend.Tests/RetroRewindWebsite.Tests.csproj
```

Integration tests need a local Postgres database named `rr_test`. See `CLAUDE.md` for the connection string and how to override it. New test classes need a `[Trait("Category", "Unit")]` or `[Trait("Category", "Integration")]` attribute.

A few project rules to keep in mind:

- Use CRLF line endings for all files.
- If you change the database schema, include the generated EF Core migration in your PR.
- Avoid `CASCADE DELETE`. If you think you need one, call it out in the PR description. `RaceResults` and `GhostSubmissions` are critical data, so double-check anything that writes or deletes there.
- The backend has no in-process rate limiting. Rate limiting is handled by Cloudflare.

We plan to run these checks automatically with GitHub Actions (see issue #191). Until then, please run them yourself.

## AI Generated Content

AI tools are allowed, but you are responsible for everything you submit. If your PR mainly uses AI-generated or AI-assisted content, include an **AI Usage** section in the PR description covering:

- Which parts were generated or assisted by AI (code, comments, docs, or other).
- Which tools you used and how you used them.
- What you changed in their output, and how you reviewed and tested it.

AI-generated images and other assets are not accepted.
