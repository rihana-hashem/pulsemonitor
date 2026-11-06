---
name: update-readme
description: Use this skill when a new feature, route, or dependency is added to the project.
---

# Update the project README

1. Review the root `README.md` and the changes that triggered the update. Confirm feature behavior, route paths and methods, and any access requirements against the implementation. Check `frontend/package.json` and the relevant `.csproj` files for added dependencies.
2. Edit the root `README.md` to explain what changed and how to use it. Include a short workflow or request example when helpful. Document each new dependency and its purpose, and update setup instructions if it introduces a prerequisite, configuration setting, or install step.
3. Keep the README organized around Project Overview, Features, Setup, and Dependencies. Follow the existing README's headings, order, and formatting where they serve the same purpose. In PulseMonitor, use the opening summary for the overview, `Features` for behavior, `Getting started` for setup, and `Technology stack` for dependencies. Update the `API documentation` table for new API routes.
4. Review the README diff and check that examples, paths, and dependency details agree with the implementation.
