# Revisa

A Rails 8 + React 19 boilerplate using [Inertia.js](https://inertia-rails.dev) and [shadcn/ui](https://ui.shadcn.com).

## What's inside

- Rails 8.1, SQLite and the Solid trio (Queue, Cache, Cable)
- Rails 8 authentication with sign up, email verification, password reset and settings
- React 19, TypeScript and Vite (`vite_rails`), with server-side rendering
- shadcn/ui components on Base UI, Tailwind CSS 4, light and dark mode
- Alba, JsRoutes, Pagy, Strong Migrations and Letter Opener
- Biome, Minitest and RuboCop
- Kamal for deployment

## Getting started

You need Ruby 4.0.7 and Node.js 22 with pnpm (`corepack enable`).

```bash
git clone https://github.com/amirzezo201/rails-inertia-boilerplate.git
cd rails-inertia-boilerplate
bin/setup
```

Open <http://localhost:3000> and sign in with `admin@example.com` / `Password1234!` (from `db/seeds.rb`).

## Commands

| Command | What it does |
| --- | --- |
| `bin/dev` | Start the app |
| `bin/rails test` | Run the tests |
| `bin/rails test:system` | Run the browser tests |
| `pnpm run lint` | Lint and format check |
| `pnpm run check` | Type check |
| `bin/ci` | Run every check |

Add UI components with `pnpm dlx shadcn@latest add <component>`.

## Deployment

Set your servers and registry in `config/deploy.yml`, then run `bin/kamal setup`.

## License

[MIT](LICENSE)
