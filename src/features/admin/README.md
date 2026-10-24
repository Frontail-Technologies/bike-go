# Admin feature modules

Each administrator domain owns its API client, React Query hooks, schemas, types, and feature-specific presentation components here. Shared transport remains in `src/lib/api`, reusable admin primitives remain in `src/components/admin`, and browser-only UI preferences remain in `src/stores/admin`.

Existing mock presentation components stay in `src/components/admin/<domain>` until their corresponding integration phase moves them, so unrelated in-progress UI changes are not staged by this preparatory refactor.
