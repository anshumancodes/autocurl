# Deploying the API to a DigitalOcean VM

The API is published as an immutable image at `ghcr.io/<owner>/<repository>:<commit-sha>` and runs as a single Docker Compose service. PostgreSQL remains external to the VM application container.

## 1. One-time VM setup

On an Ubuntu DigitalOcean VM, install Docker, Compose, and `curl`, then allow the SSH deployment user to run Docker:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 curl
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and back in, then verify `docker compose version`. Create the deployment directory:

```bash
sudo mkdir -p /opt/autocurl/api
sudo chown "$USER":"$USER" /opt/autocurl/api
```

The deployment workflow uploads `api/compose.yaml` to this directory on every run. Do not put application source, a checked-out repository, or a database container there.

## 2. GHCR authentication

Create a GitHub fine-grained token that can read packages from this repository. On the VM, authenticate once as the deployment user (or let the workflow do it on each deployment):

```bash
echo '<read-packages-token>' | docker login ghcr.io --username '<github-username>' --password-stdin
```

The workflow uses `GHCR_USERNAME` and `GHCR_TOKEN` to repeat this login before pulling the image.

## 3. Server-side environment

Create `/opt/autocurl/api/.env` on the VM and keep it out of Git. Start from `api/.env.example`, replacing every placeholder with production values. At minimum this includes `DATABASE_URL`, Clerk values, Gemini values, Razorpay values, `APP_BASE_URL`, and `WEB_APP_URL`.

The Compose file supplies `HOST=0.0.0.0` and `PORT=8000` for the container. Secrets are loaded only from `/opt/autocurl/api/.env`; they are not copied into the image or workflow.

## 4. DNS and reverse proxy

Point the DNS `A` record for `api.autocurl.lol` at the VM. Configure the existing reverse proxy to terminate TLS and proxy to `http://127.0.0.1:8000`, including the webhook paths. The application container is bound to loopback, so PostgreSQL and port 8000 are not exposed publicly.

## 5. Run a deployment

In GitHub, run **Actions → Deploy autocurl API → Run workflow**. The two jobs perform these steps:

1. Build the multi-stage image, generate Prisma Client, compile TypeScript, and push the commit-SHA tag to GHCR.
2. SSH to the VM, install the Compose file, pull that exact tag, and run `prisma migrate deploy` in a one-shot container.
3. Only after migrations succeed, replace the API container and wait for both the Docker health check and `GET http://127.0.0.1:8000/health` to pass. A failed migration or health check fails the workflow.

Required repository secrets:

| Secret | Purpose |
| --- | --- |
| `DO_HOST` | VM hostname or IP |
| `DO_USER` | SSH deployment user |
| `DO_SSH_KEY` | Private SSH key for that user |
| `GHCR_USERNAME` | GitHub username that can read the package |
| `GHCR_TOKEN` | GitHub token with package read access |

`DO_SSH_PORT` is optional and defaults to `22`. The build job uses the automatic `GITHUB_TOKEN` with only `packages: write` and `contents: read` permissions; no application secret is needed by the build.

## 6. Logs and health

```bash
cd /opt/autocurl/api
docker compose ps
docker compose logs -f --tail=100 api
curl --fail https://api.autocurl.lol/health
curl --fail https://api.autocurl.lol/health/ready
```

`/health` checks process liveness. `/health/ready` also checks the external PostgreSQL connection.

## 7. Roll back

Use a previously successful commit SHA as `IMAGE_TAG`, authenticate to GHCR, then run:

```bash
cd /opt/autocurl/api
export GHCR_IMAGE=ghcr.io/<owner>/<repository>
export IMAGE_TAG=<previous-commit-sha>
docker compose pull api migrate
docker compose run --rm migrate
docker compose up -d --no-deps api
```

Check health before considering the rollback complete. Prisma migrations are forward-only in this workflow; a rollback of application code does not automatically reverse an already-applied database migration.
