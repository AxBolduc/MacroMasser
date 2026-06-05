# Macromasser

A TanStack Start application for enumerating macrocycle compositions and masses from selected monomers.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm typecheck
```

## Deploy to Cloudflare Workers with Alchemy

Alchemy manages the Cloudflare Worker infrastructure in `alchemy.run.ts`.

Set the required Alchemy/Cloudflare credentials, then run:

```bash
pnpm deploy
```

To tear down the deployed Worker:

```bash
pnpm destroy
```
