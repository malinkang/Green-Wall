# [Green Wall](https://green-wall.leoku.dev/)

_Take a snapshot 📸 of your GitHub contributions, then share it!_

**Green Wall** is a powerful web tool that simplifies the way you review your GitHub :octocat: contributions over time. This tool allows you to generate an image of your contributions, which you can save and share with others.

[![Screenshot](./screenshot.webp)](https://green-wall.leoku.dev/)

## How it works

This project leverages the GitHub GraphQL API to retrieve data and employs Next.js API Routes to handle requests. For insights into how we manage your data, refer to [this file](./src/app/api/contribution/%5Busername%5D/route.ts).

## Usage

To showcase a live preview of your contributions on your GitHub README or website, you can use the following examples.

**Optional Parameters**

| Parameter | Description                      | Type     | Default Value | Example          |
|-----------|----------------------------------|----------|---------------|------------------|
| `year`    | Specify calendar year to display | `number` | Latest year   | `?year=2023`     |
| `theme`   | Choose color theme for image     | `string` | `Classic`     | `?theme=Violet`  |
| `width`   | Set custom image width           | `number` | 1200          | `?width=800`     |
| `height`  | Set custom image height          | `number` | 630           | `?height=400`    |

**HTML**

```html
<img src="https://green-wall.leoku.dev/api/og/share/[YOUR_USERNAME]" alt="My contributions" />
```

**Markdown**

```markdown
![](https://green-wall.leoku.dev/api/og/share/[YOUR_USERNAME])
```

This will produce a preview similar to the one shown below.

![](https://green-wall.leoku.dev/api/og/share/Codennnn)

## Tampermonkey

We also offer a [Tampermonkey script](https://greasyfork.org/en/scripts/492478-greenwall-view-all-contribution-graphs-in-github) that enables you to view the 'Green Wall' on anyone's GitHub profile page. The script adds a button to the user's GitHub Profile page, and clicking it will display the user's contribution graphs over the years.

The source code for the script is located in the file [`/plugins/script.ts`](./plugins/script.ts).

https://github.com/user-attachments/assets/694a5653-348b-4bec-9736-21e777e3ede8

## Credits

- _Inspired by:_ [GitHub Contributions Chart Generator](https://github.com/sallar/github-contributions-chart).
- _Framework:_ Next.js.
- _Font:_ [Rubik](https://fonts.google.com/specimen/Rubik) by Google Fonts.
- _Icons:_ [heroicons](https://heroicons.com).

## Running Locally

To run this project, which uses the [GitHub API](https://docs.github.com/en/graphql) to fetch data, you'll need a personal access token for authentication. For details on obtaining this token, see "[Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)".

Once you have your personal access token, create a file named `.env.local` at the root of the project and insert the token as follows:

```sh
# .env.local

# The format should be: GITHUB_ACCESS_TOKEN="[YOUR_TOKEN]"

# Example:
GITHUB_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Then you are ready to run `pnpm dev` to develop.

## Notion Database Heatmap (New)

You can also generate a heatmap from a Notion database.

- Set `NOTION_API_KEY` in your environment (server-side):

```sh
# .env.local
NOTION_API_KEY="secret_..."
```

- Start the app and open `/notion`.
- Provide:
  - Notion Database ID
  - Date property name (default: `Date`)
  - Optional Count property (number/rollup). If omitted, each page counts as 1.

The Notion mode shares the same rendering and export features as the GitHub mode.

## Database (Neon) Integration

This project can optionally persist basic user information (e.g., Notion user after OAuth) to a Postgres database via Neon (serverless, Vercel‑friendly).

Setup

- Create a Neon project and copy the HTTP connection string (postgresql://...sslmode=require).
- Add an environment variable in Vercel: `DATABASE_URL` with your Neon connection string.
- Deploy the project, then initialize tables once by calling:

```bash
curl -X POST https://YOUR_DOMAIN/api/neon/setup
```

After Notion login on `/notion`, the app automatically syncs the Notion user to the `users` table via `/api/neon/notion/sync`.

### Optional: Notion OAuth (login to list databases)

To allow users to log in with Notion and list their databases for selection:

```sh
# .env.local
NOTION_CLIENT_ID="your_public_integration_client_id"
NOTION_CLIENT_SECRET="your_public_integration_client_secret"
NOTION_REDIRECT_URI="http://localhost:3000/api/auth/notion/callback"
# Optional scopes (default: databases.read,users.read)
NOTION_OAUTH_SCOPES="databases.read,users.read"
```

- The top-right button triggers Notion login.
- After login, the `/notion` page lists the user’s databases for selection.
