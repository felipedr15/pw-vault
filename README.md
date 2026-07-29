# Password Vault

A mobile-friendly password manager web app with local encrypted storage.

## Features

- Master password setup and unlock
- AES-GCM encrypted vault in browser localStorage
- Add, edit, delete entries
- Strong password generator
- Copy username/password buttons
- Search entries
- Auto-lock timer

## Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Cloud Sync (Cloudflare Workers + D1)

The `worker/` directory contains a sync API deployed to Cloudflare Workers with a D1 database for optional cross-device vault synchronization.

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler`)
- A Cloudflare account (free tier works)

### Initial Setup

1. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

2. Create the D1 database:
   ```bash
   npm run db:create
   ```
   Copy the output `database_id` into `wrangler.toml`.

3. Run the schema migration:
   ```bash
   npm run db:migrate
   ```

4. Deploy the worker:
   ```bash
   npm run worker:deploy
   ```

### Local Development

Run the worker locally (uses a local SQLite file for D1):

```bash
npm run db:migrate:local
npm run worker:dev
```

The local worker runs at `http://localhost:8787` by default.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run worker:dev` | Start local worker dev server |
| `npm run worker:deploy` | Deploy worker to Cloudflare |
| `npm run worker:tail` | Stream live logs from deployed worker |
| `npm run db:create` | Create the D1 database |
| `npm run db:migrate` | Apply schema to remote D1 |
| `npm run db:migrate:local` | Apply schema to local D1 |

### Environment Variables

Set `ALLOWED_ORIGIN` in `wrangler.toml` (or via the Cloudflare dashboard) to restrict CORS to your deployed frontend domain in production.

## Security Notes

- The vault data is encrypted using the Web Crypto API and a key derived from your master password (PBKDF2 + AES-GCM).
- Data is stored only in this browser on this device.
- If you lose your master password, the data cannot be recovered.
- For clipboard copy to work reliably, run in a secure context (localhost or HTTPS).
