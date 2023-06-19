# Description

Please include a summary of the change and which issue is fixed. Please also
include relevant motivation and context. List any dependencies that are required
for this change.

Fixes # (issue)

# Screenshots

## Type of change

Make sure your PR name (and squashed commit name) respects [Conventional
Commits] (https://www.conventionalcommits.org/en/v1.0.0/) Ex:

- `feat(NLI): Added new visualizations to NLI`
  - This causes a `MINOR` version bump
- `fix(Graphs): Changed graph margins`
  - This causes a `PATCH` version bump
- `perf(API): switched data structure for API`
  - This causes a `MAJOR` version bump

Adding a ! triggers a `MAJOR` version bump, meaning breaking change ex:
`feat(API)!: switched data structure for API` -- see above, not currently due to
github action (.github/workflows/bump_prod_deploy.yml) using angular style

Other recommended tags can be: `build:`, `chore:`, `ci:`, `docs:`, `style:`,
`refactor:`, `perf:`, `test:`

# How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide
instructions so we can reproduce. Please also list any relevant details for your
test configuration

# Checklist:

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented on my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My code is merged and up-to-date with the main branch
