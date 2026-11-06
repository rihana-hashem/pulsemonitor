# Repository Guidelines

## Project Structure

- `src/PulseMonitor.Domain` holds domain rules. `src/PulseMonitor.Application` holds use cases and interfaces. `src/PulseMonitor.Infrastructure` implements persistence, Hangfire jobs, authentication, and reporting. `src/PulseMonitor.Api` wires up FastEndpoints and SignalR.
- `frontend/src/` contains the React and TypeScript app. Put feature-specific code in `features/`, routed screens in `pages/`, and shared UI in `components/`. Static assets live in `frontend/public/` and documentation screenshots in `docs/screenshots/`.
- Backend tests live in `tests/PulseMonitor.UnitTests` and `tests/PulseMonitor.IntegrationTests`. The numbered SQL scripts at the root are the source of truth for the database schema.

## Build and Run

Use the .NET 10 SDK, SQL Server, and Node.js 24. Follow [README.md](README.md) to apply SQL scripts in order and configure the JWT signing key and bootstrap admin password with .NET user secrets.

- `dotnet build PulseMonitor.slnx` builds the backend solution.
- `dotnet run --project src/PulseMonitor.Api --launch-profile http` starts the API on port 5184.
- In `frontend/`, run `npm ci` to install locked dependencies and `npm run dev` to start Vite. Run `npm run lint` for Oxlint and `npm run build` for TypeScript checks and a production bundle.

## Coding Style

Use four spaces and file-scoped namespaces in C#. Keep endpoints under `Features/<Area>/<Action>/` and use names such as `CreateServerEndpoint`. Use two spaces in TypeScript, PascalCase for React components, and camelCase for hooks and utilities, such as `useNow`.

## Testing

Use xUnit and name test classes `<Subject>Tests` and methods like `SaveAsync_ShouldPersistServerAndDiskMetrics`. Run `dotnet test tests/PulseMonitor.UnitTests` for isolated logic and `dotnet test tests/PulseMonitor.IntegrationTests` for SQL-backed tests. Seed the dedicated `PulseMonitorIntegrationTestsDb` before running integration tests. Coverlet is available through `--collect "XPlat Code Coverage"`. For frontend changes, run lint and build and exercise the affected flow locally.

## Commits and Pull Requests

Use short, imperative commit subjects, following examples such as “Add README and architecture documentation.” In pull requests, describe the behavior change and verification, link related issues when available, and include screenshots for visible UI changes.
