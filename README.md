# Import Software

Web application deployed to HostGator via GitHub Actions.

## Structure

```
public/                 # Site root — deployed to HostGator public_html
.github/workflows/      # CI/CD (FTP deploy on push to main)
.env                    # Local environment vars (gitignored)
.env.example            # Template — copy to .env
```

## Local setup

```bash
cp .env.example .env    # then fill in values
```

Serve the static site locally:

```bash
cd public && python -m http.server 8000
# open http://localhost:8000
```

## Deployment

Pushing to `main` triggers the **Deploy to HostGator** workflow, which uploads
`public/` to the server over FTP. It can also be run manually from the
**Actions** tab (`workflow_dispatch`).

### Required GitHub Secrets

Set these under **Settings > Secrets and variables > Actions**:

| Secret            | Description                          | Example                |
| ----------------- | ------------------------------------ | ---------------------- |
| `FTP_SERVER`      | HostGator FTP host                   | `ftp.yourdomain.com`   |
| `FTP_USERNAME`    | FTP account username                 | `user@yourdomain.com`  |
| `FTP_PASSWORD`    | FTP account password                 | `••••••••`             |
| `FTP_SERVER_DIR`  | Target directory on the server       | `/public_html/`        |

> FTP credentials come from your HostGator cPanel (**Files > FTP Accounts**).
