# Operations

## Deploy

```bash
bash scripts/deploy.sh
```

The script verifies env, builds images, starts Compose services, checks frontend health, and records release metadata in `deploy/releases/current`.

## Health

```bash
bash scripts/healthcheck.sh
```

Default target is `http://localhost:3000/api/health`. Override with `FRONTEND_HEALTH_URL`.

## CMS Revalidation

Set the same `REVALIDATE_SECRET` in frontend and CMS env. CMS lifecycles call `FRONTEND_REVALIDATE_URL` after product, category, blog post, policy, or site setting changes. Frontend maps those model events to fixed cache tags; arbitrary internet-provided tags are not accepted.

## VPS CMS Deployment

See `docs/VPS_CMS_DEPLOYMENT.md` for the production CMS deployment flow, random secret generation commands, public-role permission bootstrap, seed, and revalidation checks.

## Backup

```bash
bash scripts/backup-db.sh
```

When DB env is missing, the script performs a dry-run. With DB env present, it writes a `pg_dump -Fc` file under `./backups` or `BACKUP_DIR`.

## Restore

```bash
RESTORE_CONFIRM=yes bash scripts/restore-db.sh backups/aivisionary-YYYYMMDD.dump
```

Restore is explicit and never part of automatic rollback.

## Rollback

```bash
bash scripts/rollback.sh
```

Container rollback is separated from database restore. Review migration impact before restoring database backups.

## Logs

Use Docker logs per service:

```bash
docker compose -f deploy/docker-compose.yml logs -f frontend
docker compose -f deploy/docker-compose.yml logs -f cms
docker compose -f deploy/docker-compose.yml logs -f nginx
```
