# Family Chat

A small, private family chat built with FastAPI, PostgreSQL, and WebSockets.

## Settings

Application configuration is centralized in `settings.py`, similar to Django's
settings module. Copy `.env.example` to `.env` and edit the values there:

```powershell
Copy-Item .env.example .env
```

Environment variables override matching `.env` values. Set
`SESSION_COOKIE_SECURE=true` when the application is served over HTTPS.

## Docker deployment

Set a strong database password and session secret in `.env`, then start the
application and PostgreSQL together:

```powershell
docker compose up -d --build
docker compose ps
```

Open <http://127.0.0.1:8765>. Uploaded files, profile photos, and PostgreSQL
data are stored in named Docker volumes and survive container replacement.

For an internet-facing deployment, place an HTTPS reverse proxy in front of
port 8765 and set `SESSION_COOKIE_SECURE=true`. Do not expose PostgreSQL port
5432 publicly.

### Closed-app push notifications

Generate one VAPID key pair on the Ubuntu server:

```bash
openssl ecparam -name prime256v1 -genkey -noout -out vapid_private.pem
openssl ec -in vapid_private.pem -outform DER | base64 -w 0
openssl ec -in vapid_private.pem -pubout -outform DER \
  | tail -c 65 | base64 -w 0 | tr '/+' '_-' | tr -d '='
```

Put the output of the second command into
`VAPID_PRIVATE_KEY`, and the URL-safe string from the third line into
`VAPID_PUBLIC_KEY`. Also set a real contact address:

```dotenv
VAPID_PRIVATE_KEY=base64-private-key
VAPID_PUBLIC_KEY=url-safe-public-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

Keep the key pair stable. Replacing it requires every device to enable push
notifications again.

Back up the named volumes regularly:

- `family_chat_postgres`
- `family_chat_uploads`
- `family_chat_avatars`

## Manual development setup

### 1. Start PostgreSQL

The easiest option is Docker Desktop:

```powershell
docker compose up -d
```

Or use an existing PostgreSQL server and set its connection details in `.env`:

```dotenv
POSTGRES_DB=family_chat
POSTGRES_USER=family_chat
POSTGRES_PASSWORD=change-this-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

`settings.py` builds the PostgreSQL connection string from these values.

### 2. Run the app

```powershell
cd D:\Python\Projects\family-chat
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8765
```

Open <http://127.0.0.1:8765>. The first person to open a fresh installation
creates the administrator account. The administrator can then create accounts
for family members.

## Important

- Use this locally while developing.
- Change the database password before deploying.
- Before internet deployment, use HTTPS, configure backups, and place the app
  behind a production reverse proxy.
- Messages are protected by login and HTTPS when deployed correctly, but they
  are not end-to-end encrypted.

You may provide the session secret through an environment variable in
production. Otherwise, the app creates a private `.family_chat_secret` file:

```powershell
$env:FAMILY_CHAT_SECRET = "replace-with-a-long-random-secret"
```

The application creates its PostgreSQL tables automatically at startup.

An old `family_chat.db` file, if present, is not used by this version. Existing
SQLite data is not migrated automatically.

## Notifications

Use **Enable notifications** in the chat header and approve the browser prompt.
Incoming messages display a browser notification when the tab is hidden. This
local notification mode requires the chat page to remain open. Closed-app push
notifications require a service worker, HTTPS, and a web-push provider.

## Private conversations

Each family member has a separate one-to-one conversation. The contact list
shows unread counts and recent activity. Sent messages display one check mark,
two gray check marks when delivered, and two blue check marks after the
recipient opens the conversation.

Messages created by the earlier shared-room version remain in PostgreSQL but
are not displayed in private conversations.

Online presence, typing indicators, last-seen timestamps, and delivered message
status update live while the application is running.

Users can change their own password from the sidebar. Administrators can select
a family member and issue a temporary password with **Reset password**.

Messages support quoted replies. Senders can edit their own messages or replace
them with a persistent **Message deleted** placeholder.

Photos and common family documents can be attached to messages. Files are kept
in the private `uploads` directory and are accessible only to the sender and
recipient. The default maximum attachment size is 10 MB.

The web app is installable as a PWA. HTTPS plus the VAPID settings enable
notifications when the installed app is closed on supported browsers.

## Group conversations

Any family member can use **New group** in the sidebar, enter a group name,
and choose members. Groups have independent unread counts, typing indicators,
quoted replies, edits, deleted-message placeholders, and protected
attachments. Only group members can load its history or files.

Group tables and the optional `messages.group_id` column are created
automatically when the app starts. After pulling this update on Ubuntu, run
`docker compose up -d --build`; no manual SQL migration is required.

Group administrators can open **Group info** to rename a group, add or remove
members, and promote or demote group administrators. Every group must retain
at least one administrator. Any member may leave after another administrator
has been promoted when necessary.

Use **Search messages** in the sidebar to search message text and attachment
names across private conversations and groups you belong to. Selecting a result
opens the correct conversation and highlights the matching message.

## Voice messages

On supported mobile and desktop browsers, select the microphone in the
composer, record up to five minutes, stop, preview the recording, and send it.
Voice messages work in private and group conversations and use the same
member-only attachment authorization as photos and documents.

The recording limit can be changed with `MAX_VOICE_SECONDS`. Microphone access
requires HTTPS in production; localhost is permitted during development.

## Photo optimization and media gallery

Large JPG, PNG, and WebP photos are resized in the browser before upload.
Animated GIF files are preserved without conversion. Configure the longest
image edge and WebP quality with:

```dotenv
IMAGE_MAX_DIMENSION=1920
IMAGE_COMPRESSION_QUALITY=0.82
```

Open the media button in any conversation to browse photos, documents, and
voice messages. Photos open in a full-screen zoomable viewer. Gallery items can
be downloaded or used to jump to the original message. Administrators can see
total storage usage and category totals in **Manage family**.

## Passkeys

Passkeys let family members sign in with their phone fingerprint, face unlock,
or screen lock. Configure these values for the final HTTPS hostname:

```dotenv
WEBAUTHN_RP_ID=chat.yourdomain.com
WEBAUTHN_RP_NAME=Family Chat
WEBAUTHN_ORIGIN=https://chat.yourdomain.com
```

For this deployment, use `marschat.ssnapps.com` as the RP ID and
`https://marschat.ssnapps.com` as the origin. These values must exactly match
the hostname family members use. After signing in normally once, open the
profile dialog and choose **Set up phone sign-in**.

## Email invitations

Administrators invite new family members by email. The recipient receives a
single-use registration link, creates their account without a temporary
password, and is guided to set up a passkey.

Set the public URL and SMTP provider in `.env`:

```dotenv
PUBLIC_URL=https://marschat.ssnapps.com
INVITE_EXPIRY_SECONDS=259200
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=family-chat@example.com
SMTP_STARTTLS=true
```

For Gmail, use `smtp.gmail.com`, port `587`, and a Google App Password rather
than the normal account password. Keep all SMTP credentials only in `.env`.

## Administration

Administrators can open **Manage family** from the sidebar to:

- resend or revoke pending invitations;
- disable, enable, promote, or remove members;
- sign a member out from every device;
- inspect and revoke registered passkeys.

The current administrator cannot disable, demote, or delete their own account,
and the last active administrator is protected.
