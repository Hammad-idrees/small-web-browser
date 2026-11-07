# Small Web Browser

Needs Node 22, pnpm, and MongoDB running on `127.0.0.1:27017`.

## Install

```sh
pnpm install
```

## Seed the database

```sh
pnpm seed
```

## Run both sides

```sh
pnpm dev
```

Web: http://localhost:3000 · API: http://localhost:4000

Or one side at a time:

```sh
pnpm build:contracts
pnpm --filter api dev
pnpm --filter web dev
```

## Production build

```sh
pnpm build
pnpm --filter api start:prod
pnpm --filter web start
```

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Browser tests (first time: `pnpm --filter e2e exec playwright install chromium`):

```sh
pnpm test:browser
```

## Settings

Optional. Defaults are in `api/.env.example` and `web/.env.example`.
