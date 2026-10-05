# Life OS: accounts and PostgreSQL setup

**Checked 5 October 2026.** Setup guidance, not a record of completed connections. The calendar across the attached apps can be built while these steps wait. No account was connected, PostgreSQL installed or password reset during this work.

## What a connection gives you

| Place | What signs in | What it enables |
|---|---|---|
| Claude / Cowork | A connector in your Claude account | Claude can use the selected external service with the permissions you grant. |
| ChatGPT / Codex | A plugin and its connected provider account | The assistant can use the service through the tools available in that session. Claude's connection does not transfer here. |
| Life OS itself | A future account integration in the Life OS server | The app could read and refresh external calendars without a chat. This is not implemented. |

Signing into Microsoft or Google in a browser does not connect Life OS. Installing an assistant plugin also does not give Life OS its OAuth tokens or automatically populate its calendar. The current source has no Microsoft/Google OAuth routes or token store. A future import pipeline can accept exports produced by your assistant; a native subscription or OAuth provider needs its own approved brief.

## Connect accounts to your assistant

**Claude:** open **Customize → Connectors**, choose Google Calendar (and Drive or Gmail only if needed), select Connect, then finish Google's sign-in and consent screen yourself. For Microsoft, choose **Microsoft 365** and use your Cardiff university account. Anthropic's Microsoft connector requires a work/school Microsoft Entra tenant and one-time consent from its Global Administrator before users can connect; a personal Outlook account does not qualify. Whether Cardiff has enabled it is unknown. If it reports that admin approval is required, save the app name and requested permissions for university IT; retries cannot grant tenant consent. Sources: [Claude connector setup](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities), [Google connectors](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors), [Microsoft 365](https://support.claude.com/en/articles/15183774-connect-to-microsoft-365).

**ChatGPT / Codex:** open **Customize → Plugins** in the available desktop interface, install Google Calendar and/or Google Drive, or Outlook Calendar and the Microsoft services you need, then complete the offered provider sign-in flow. Choose the university Microsoft account for university data and the intended Google account for personal data. The account and plugin must both be available in this session before an assistant can test a read. Availability depends on your plan and workspace. Source: [official OpenAI documentation](https://learn.chatgpt.com/docs/get-started-with-work).

Keep sign-in, passwords and MFA on the provider's page. First check a small read, such as “list my calendars” or “show tomorrow's events.” This verifies access without sending messages or changing events. The setup has succeeded only when a real read from the intended account works.

For future **native Life OS Microsoft access**, delegated Graph permissions would act as the signed-in user. These differ from Anthropic's connector consent: some delegated scopes normally allow user consent, but Cardiff's tenant policy may still require an administrator. Application permissions require admin consent and are wider than a single-user calendar needs. Start with a read-only calendar scope sufficient for the chosen API and review it before implementation. Source: [Microsoft Graph permissions](https://learn.microsoft.com/en-us/graph/permissions-overview).

## University dates and materials

- **Learning Central due dates:** Cardiff's July 2026 guidance gives a verified route: global Calendar → cog → three dots beside Calendar Settings → **Share calendar**. Copy the private link and add it as a calendar from URL in your external calendar app. This is a subscription, so later source changes can refresh; an imported `.ics` file is a snapshot. Life OS does not yet subscribe to this link. Keep the link out of git and public notes. [Cardiff guidance](https://blogs.cardiff.ac.uk/LTAcademy/keeping-on-top-of-due-dates-in-learning-central/).
- **Teaching timetable:** Cardiff's official MyTimetable handout describes Export → subscription choices and downloadable iCalendar/CSV. That handout is from 2014, so the exact current menu and the options available to your account remain unverified. Open your signed-in timetable and look for Export or Subscribe; use an offered calendar URL, `.ics` or CSV. Do not assume the Learning Central calendar contains all teaching sessions. [Historical Cardiff handout](https://blogs.cardiff.ac.uk/timetables-project/wp-content/uploads/sites/298/2014/08/MyTimetable-tutorial-handout-v0.1.pdf).
- **Materials and SIMS records:** Microsoft consent does not establish access to either system. Use the downloads/exports each page offers until a separate authenticated route has been verified. The Learning Central in-app browser remains a later idea; an assistant browser session is distinct from embedding the site inside Life OS.

When the subscription/import work is built, preserve source IDs and recurrence exceptions, show sync failures and last refresh time, and verify a real lecture and an assessment date against the source. No source writes should be required to display these dates.

## PostgreSQL: Xar's installation checklist

The earlier Claude transcript reported a leftover July cluster under `C:\Program Files\PostgreSQL\18\data` and no working server installation. That is historical evidence, not a current check. Leave that directory untouched, even if it appears empty. A new cluster has a new superuser password; it does not need the old database password. If the installer instead detects an old service account or upgrade and asks for its existing password, stop and record the message rather than deleting or resetting anything.

1. Use the interactive Windows installer linked by [postgresql.org](https://www.postgresql.org/download/windows/). PostgreSQL's support table currently lists **18.6** as the latest stable minor release and 19 as beta; recheck at download time and select a supported stable version, not a beta. [Versioning table](https://www.postgresql.org/support/versioning/).
2. Include **PostgreSQL Server** and **Command Line Tools**. pgAdmin is optional; skip Stack Builder and extensions for now. Use the interactive wizard so you can choose the password and data directory. [EDB installation steps](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/).
3. Choose a **new empty data directory outside this repository and outside OneDrive/cloud sync**. A proposed path is `C:\ProgramData\LifeOS\postgresql-data`; it is not selected or created by this guide. Let the installer set the service's permissions. Never select the July directory or an existing database directory.
4. Choose and save the new `postgres` password in your password manager; enter it only into the local installer/`psql` prompt. PostgreSQL's password and pgAdmin's master password are separate. Do not paste either into a chat or committed file.
5. Keep port **5432** if free; otherwise record the chosen free port. No inbound firewall opening is needed for local Life OS. After installation, verify the server listens only on loopback and that host authentication is password-based. Have the foundation setup review the configuration; never solve login trouble by enabling `trust` or a network-wide listener.
6. Verify locally with SQL Shell / `psql`: host `127.0.0.1`, selected port, database `postgres`, user `postgres`. Enter the password when prompted. Run `SELECT version();` and `SHOW listen_addresses;`. Record version and port, not credentials. A successful installer alone is not the connection check.
7. Stop here for the calendar session. Installing PostgreSQL does not migrate Life OS; the core remains on SQLite until the foundation brief is built and verified.

**Foundation setup, after the approved brief:** create databases `lifeos` and `lifeos_test`, a migration owner and a restricted app role, plus a separate test role confined to `lifeos_test`. Everyday Life OS must not run as `postgres`, and tests must not use production credentials. Keep local configuration ignored by git. Back up the old SQLite core through SQLite, import with before/after counts, and prove a `pg_dump` restore into the test database before changing the live connection. No attached-app data moves during installation. Never copy a PostgreSQL data directory as the backup strategy.

**What to report back:** “Installed PostgreSQL [version], loopback port [port], local login works.” If blocked, give the error text with passwords, connection strings and private paths removed. The password stays on your computer.
