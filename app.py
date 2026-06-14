import asyncio
import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

import psycopg
from psycopg.rows import dict_row
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pywebpush import WebPushException, webpush
from webauthn import (
    base64url_to_bytes,
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from settings import settings

ALLOWED_ATTACHMENT_TYPES = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/gif": {".gif"},
    "image/webp": {".webp"},
    "application/pdf": {".pdf"},
    "text/plain": {".txt"},
    "application/msword": {".doc"},
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        ".docx"
    },
    "application/vnd.ms-excel": {".xls"},
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        ".xlsx"
    },
}
ALLOWED_AVATAR_TYPES = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
}


def db() -> psycopg.Connection:
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def initialize_database() -> None:
    with db() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                username VARCHAR(30) NOT NULL,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN NOT NULL DEFAULT FALSE,
                created_at BIGINT NOT NULL,
                last_seen BIGINT,
                avatar_storage_name TEXT,
                avatar_content_type TEXT,
                profile_updated_at BIGINT
            );
            """
        )
        connection.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen BIGINT"
        )
        connection.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_storage_name TEXT"
        )
        connection.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_content_type TEXT"
        )
        connection.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_updated_at BIGINT"
        )
        connection.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username))"
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipient_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                body TEXT NOT NULL,
                created_at BIGINT NOT NULL,
                delivered_at BIGINT,
                read_at BIGINT,
                reply_to_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
                edited_at BIGINT,
                deleted_at BIGINT,
                attachment_name TEXT,
                attachment_storage_name TEXT,
                attachment_content_type TEXT,
                attachment_size BIGINT
            );
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                endpoint TEXT UNIQUE NOT NULL,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                created_at BIGINT NOT NULL
            );
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS passkeys (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                credential_id BYTEA UNIQUE NOT NULL,
                public_key BYTEA NOT NULL,
                sign_count BIGINT NOT NULL DEFAULT 0,
                transports JSONB NOT NULL DEFAULT '[]'::jsonb,
                device_type TEXT,
                backed_up BOOLEAN NOT NULL DEFAULT FALSE,
                created_at BIGINT NOT NULL,
                last_used_at BIGINT
            );
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS webauthn_challenges (
                id UUID PRIMARY KEY,
                challenge BYTEA NOT NULL,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                purpose TEXT NOT NULL,
                expires_at BIGINT NOT NULL
            );
            """
        )
        connection.execute(
            "DELETE FROM webauthn_challenges WHERE expires_at < %s",
            (int(time.time()),),
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id BIGINT REFERENCES users(id) ON DELETE CASCADE"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at BIGINT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at BIGINT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT REFERENCES messages(id) ON DELETE SET NULL"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at BIGINT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at BIGINT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_storage_name TEXT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_content_type TEXT"
        )
        connection.execute(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size BIGINT"
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS messages_direct_lookup_idx
            ON messages (user_id, recipient_id, id)
            """
        )


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{base64.urlsafe_b64encode(salt).decode()}:{base64.urlsafe_b64encode(digest).decode()}"


def password_matches(password: str, stored: str) -> bool:
    try:
        salt_text, expected_text = stored.split(":", 1)
        salt = base64.urlsafe_b64decode(salt_text)
        expected = base64.urlsafe_b64decode(expected_text)
        actual = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def make_session(user_id: int) -> str:
    payload = f"{user_id}:{int(time.time())}"
    signature = hmac.new(
        settings.secret_key, payload.encode(), hashlib.sha256
    ).hexdigest()
    return f"{payload}:{signature}"


def session_user_id(token: str | None) -> int | None:
    if not token:
        return None
    try:
        user_id, issued_at, signature = token.split(":", 2)
        payload = f"{user_id}:{issued_at}"
        expected = hmac.new(
            settings.secret_key, payload.encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        if time.time() - int(issued_at) > settings.session_age_seconds:
            return None
        return int(user_id)
    except (ValueError, TypeError):
        return None


def avatar_url(user: dict) -> str | None:
    if not user.get("avatar_storage_name"):
        return None
    version = user.get("profile_updated_at") or 0
    return f"/api/users/{user['id']}/avatar?v={version}"


def public_user(user: dict) -> dict:
    result = {
        key: value
        for key, value in user.items()
        if key not in {"avatar_storage_name", "avatar_content_type", "profile_updated_at"}
    }
    result["avatar_url"] = avatar_url(user)
    return result


def get_user(user_id: int | None) -> dict | None:
    if user_id is None:
        return None
    with db() as connection:
        row = connection.execute(
            """
            SELECT id, username, display_name, is_admin,
                   avatar_storage_name, profile_updated_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        ).fetchone()
    return public_user(dict(row)) if row else None


def user_from_request(request: Request) -> dict:
    user = get_user(
        session_user_id(request.cookies.get(settings.session_cookie_name))
    )
    if not user:
        raise HTTPException(401, "Please sign in")
    return user


def create_webauthn_challenge(
    challenge: bytes,
    purpose: str,
    user_id: int | None = None,
) -> str:
    ceremony_id = uuid.uuid4()
    with db() as connection:
        connection.execute(
            "DELETE FROM webauthn_challenges WHERE expires_at < %s",
            (int(time.time()),),
        )
        connection.execute(
            """
            INSERT INTO webauthn_challenges (id, challenge, user_id, purpose, expires_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                ceremony_id,
                challenge,
                user_id,
                purpose,
                int(time.time()) + 300,
            ),
        )
    return str(ceremony_id)


def consume_webauthn_challenge(
    ceremony_id: str,
    purpose: str,
    user_id: int | None = None,
) -> dict:
    try:
        challenge_id = uuid.UUID(ceremony_id)
    except ValueError:
        raise HTTPException(400, "Invalid passkey request") from None
    with db() as connection:
        if user_id is None:
            row = connection.execute(
                """
                DELETE FROM webauthn_challenges
                WHERE id = %s AND purpose = %s AND expires_at >= %s
                RETURNING challenge, user_id
                """,
                (challenge_id, purpose, int(time.time())),
            ).fetchone()
        else:
            row = connection.execute(
                """
                DELETE FROM webauthn_challenges
                WHERE id = %s
                  AND purpose = %s
                  AND expires_at >= %s
                  AND user_id = %s
                RETURNING challenge, user_id
                """,
                (challenge_id, purpose, int(time.time()), user_id),
            ).fetchone()
    if not row:
        raise HTTPException(400, "Passkey request expired or was already used")
    return dict(row)


def public_message(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "recipient_id": row["recipient_id"],
        "display_name": row["display_name"],
        "body": row["body"],
        "created_at": row["created_at"],
        "delivered_at": row["delivered_at"],
        "read_at": row["read_at"],
        "reply_to_id": row["reply_to_id"],
        "reply_body": row["reply_body"],
        "reply_attachment_name": row["reply_attachment_name"],
        "reply_display_name": row["reply_display_name"],
        "reply_deleted_at": row["reply_deleted_at"],
        "edited_at": row["edited_at"],
        "deleted_at": row["deleted_at"],
        "attachment_name": row["attachment_name"],
        "attachment_content_type": row["attachment_content_type"],
        "attachment_size": row["attachment_size"],
        "attachment_url": (
            f"/api/messages/{row['id']}/attachment"
            if row["attachment_storage_name"] and not row["deleted_at"]
            else None
        ),
    }


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, min_length=1, max_length=50)


class MessageInput(BaseModel):
    recipient_id: int = Field(gt=0)
    body: str = Field(min_length=1, max_length=4000)
    reply_to_id: int | None = Field(default=None, gt=0)


class PushKeys(BaseModel):
    p256dh: str = Field(min_length=20, max_length=500)
    auth: str = Field(min_length=8, max_length=200)


class PushSubscriptionInput(BaseModel):
    endpoint: str = Field(min_length=20, max_length=2048)
    keys: PushKeys


class PasskeyResponse(BaseModel):
    ceremony_id: str
    credential: dict


class MessageEditInput(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class PasswordChangeInput(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetInput(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        connections = self.connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.connections.pop(user_id, None)
            return True
        return False

    def is_online(self, user_id: int) -> bool:
        return bool(self.connections.get(user_id))

    def online_user_ids(self) -> set[int]:
        return set(self.connections)

    async def send_to_users(self, user_ids: set[int], payload: dict) -> None:
        dead = []
        for user_id in user_ids:
            for websocket in self.connections.get(user_id, []).copy():
                try:
                    await websocket.send_json(payload)
                except Exception:
                    dead.append((user_id, websocket))
        for user_id, websocket in dead:
            self.disconnect(user_id, websocket)

    async def broadcast_presence(
        self, user_id: int, is_online: bool, last_seen: int | None
    ) -> None:
        await self.send_to_users(
            self.online_user_ids() - {user_id},
            {
                "type": "presence",
                "user_id": user_id,
                "is_online": is_online,
                "last_seen": last_seen,
            },
        )


manager = ConnectionManager()


def send_push_sync(recipient_id: int, payload: dict) -> None:
    if not settings.vapid_private_key or not settings.vapid_public_key:
        return
    with db() as connection:
        subscriptions = connection.execute(
            """
            SELECT endpoint, p256dh, auth
            FROM push_subscriptions
            WHERE user_id = %s
            """,
            (recipient_id,),
        ).fetchall()
    expired = []
    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription["endpoint"],
                    "keys": {
                        "p256dh": subscription["p256dh"],
                        "auth": subscription["auth"],
                    },
                },
                data=json.dumps(payload),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
                ttl=60 * 60 * 24,
                timeout=10,
            )
        except WebPushException as exception:
            if exception.response is not None and exception.response.status_code in {404, 410}:
                expired.append(subscription["endpoint"])
        except Exception:
            continue
    if expired:
        with db() as connection:
            connection.execute(
                "DELETE FROM push_subscriptions WHERE endpoint = ANY(%s)",
                (expired,),
            )


async def send_push(recipient_id: int, sender: dict, message: dict) -> None:
    await asyncio.to_thread(
        send_push_sync,
        recipient_id,
        {
            "title": sender["display_name"],
            "body": message["body"] or f"Attachment: {message['attachment_name']}",
            "tag": f"family-message-{message['id']}",
            "contactId": sender["id"],
        },
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.avatar_dir.mkdir(parents=True, exist_ok=True)
    initialize_database()
    yield


app = FastAPI(title=settings.app_title, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(settings.static_dir / "index.html")


@app.get("/manifest.webmanifest")
def web_manifest() -> FileResponse:
    return FileResponse(
        settings.static_dir / "manifest.webmanifest",
        media_type="application/manifest+json",
    )


@app.get("/sw.js")
def service_worker() -> FileResponse:
    return FileResponse(
        settings.static_dir / "sw.js",
        media_type="application/javascript",
        headers={
            "Cache-Control": "no-cache",
            "Service-Worker-Allowed": "/",
        },
    )


@app.get("/health")
def health() -> dict:
    with db() as connection:
        connection.execute("SELECT 1").fetchone()
    return {"status": "ok"}


@app.get("/api/status")
def status(request: Request) -> dict:
    with db() as connection:
        needs_setup = connection.execute(
            "SELECT COUNT(*) AS user_count FROM users"
        ).fetchone()["user_count"] == 0
    user = get_user(
        session_user_id(request.cookies.get(settings.session_cookie_name))
    )
    return {
        "needs_setup": needs_setup,
        "user": user,
        "max_attachment_bytes": settings.max_attachment_bytes,
        "max_avatar_bytes": settings.max_avatar_bytes,
        "push_public_key": settings.vapid_public_key,
    }


@app.post("/api/push/subscriptions")
def save_push_subscription(
    subscription: PushSubscriptionInput,
    request: Request,
) -> dict:
    user = user_from_request(request)
    parsed_endpoint = urlparse(subscription.endpoint)
    if (
        parsed_endpoint.scheme != "https"
        or not parsed_endpoint.hostname
        or parsed_endpoint.username
        or parsed_endpoint.password
        or parsed_endpoint.hostname in {"localhost", "127.0.0.1", "::1"}
    ):
        raise HTTPException(400, "Invalid push subscription endpoint")
    with db() as connection:
        connection.execute(
            """
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (endpoint) DO UPDATE
            SET user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                created_at = EXCLUDED.created_at
            """,
            (
                user["id"],
                subscription.endpoint,
                subscription.keys.p256dh,
                subscription.keys.auth,
                int(time.time()),
            ),
        )
    return {"ok": True}


@app.post("/api/passkeys/register/options")
def passkey_registration_options(request: Request) -> dict:
    user = user_from_request(request)
    with db() as connection:
        rows = connection.execute(
            "SELECT credential_id FROM passkeys WHERE user_id = %s",
            (user["id"],),
        ).fetchall()
    options = generate_registration_options(
        rp_id=settings.webauthn_rp_id,
        rp_name=settings.webauthn_rp_name,
        user_id=str(user["id"]).encode(),
        user_name=user["username"],
        user_display_name=user["display_name"],
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        exclude_credentials=[
            PublicKeyCredentialDescriptor(id=bytes(row["credential_id"]))
            for row in rows
        ],
    )
    return {
        "ceremony_id": create_webauthn_challenge(
            options.challenge,
            "registration",
            user["id"],
        ),
        "options": json.loads(options_to_json(options)),
    }


@app.post("/api/passkeys/register/verify")
def verify_passkey_registration(
    payload: PasskeyResponse,
    request: Request,
) -> dict:
    user = user_from_request(request)
    ceremony = consume_webauthn_challenge(
        payload.ceremony_id,
        "registration",
        user["id"],
    )
    try:
        verification = verify_registration_response(
            credential=payload.credential,
            expected_challenge=bytes(ceremony["challenge"]),
            expected_rp_id=settings.webauthn_rp_id,
            expected_origin=settings.webauthn_origin,
            require_user_verification=True,
        )
    except Exception as exception:
        raise HTTPException(400, f"Passkey verification failed: {exception}") from None

    transports = payload.credential.get("response", {}).get("transports", [])
    with db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO passkeys (
                user_id, credential_id, public_key, sign_count, transports,
                device_type, backed_up, created_at
            )
            VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s, %s)
            ON CONFLICT (credential_id) DO NOTHING
            """,
            (
                user["id"],
                verification.credential_id,
                verification.credential_public_key,
                verification.sign_count,
                json.dumps(transports),
                verification.credential_device_type.value,
                verification.credential_backed_up,
                int(time.time()),
            ),
        )
    if cursor.rowcount != 1:
        raise HTTPException(409, "This passkey is already registered")
    return {"ok": True}


@app.post("/api/passkeys/authenticate/options")
def passkey_authentication_options() -> dict:
    options = generate_authentication_options(
        rp_id=settings.webauthn_rp_id,
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    return {
        "ceremony_id": create_webauthn_challenge(
            options.challenge,
            "authentication",
        ),
        "options": json.loads(options_to_json(options)),
    }


@app.post("/api/passkeys/authenticate/verify")
def verify_passkey_authentication(
    payload: PasskeyResponse,
    response: Response,
) -> dict:
    ceremony = consume_webauthn_challenge(
        payload.ceremony_id,
        "authentication",
    )
    credential_id = payload.credential.get("id")
    if not isinstance(credential_id, str):
        raise HTTPException(400, "Invalid passkey credential")
    try:
        credential_id_bytes = base64url_to_bytes(credential_id)
    except Exception:
        raise HTTPException(400, "Invalid passkey credential") from None
    with db() as connection:
        passkey = connection.execute(
            """
            SELECT id, user_id, public_key, sign_count
            FROM passkeys
            WHERE credential_id = %s
            """,
            (credential_id_bytes,),
        ).fetchone()
    if not passkey:
        raise HTTPException(401, "Passkey is not registered")
    try:
        verification = verify_authentication_response(
            credential=payload.credential,
            expected_challenge=bytes(ceremony["challenge"]),
            expected_rp_id=settings.webauthn_rp_id,
            expected_origin=settings.webauthn_origin,
            credential_public_key=bytes(passkey["public_key"]),
            credential_current_sign_count=passkey["sign_count"],
            require_user_verification=True,
        )
    except Exception:
        raise HTTPException(401, "Passkey verification failed") from None
    with db() as connection:
        connection.execute(
            """
            UPDATE passkeys
            SET sign_count = %s, last_used_at = %s
            WHERE id = %s
            """,
            (
                verification.new_sign_count,
                int(time.time()),
                passkey["id"],
            ),
        )
    response.set_cookie(
        settings.session_cookie_name,
        make_session(passkey["user_id"]),
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="strict",
        max_age=settings.session_age_seconds,
    )
    return {"ok": True}


@app.delete("/api/push/subscriptions")
def delete_push_subscription(
    subscription: PushSubscriptionInput,
    request: Request,
) -> dict:
    user = user_from_request(request)
    with db() as connection:
        connection.execute(
            "DELETE FROM push_subscriptions WHERE user_id = %s AND endpoint = %s",
            (user["id"], subscription.endpoint),
        )
    return {"ok": True}


@app.put("/api/profile")
async def update_profile(
    request: Request,
    display_name: str = Form(...),
    remove_avatar: bool = Form(False),
    avatar: UploadFile | None = File(None),
) -> dict:
    user = user_from_request(request)
    clean_name = display_name.strip()
    if not clean_name or len(clean_name) > 50:
        raise HTTPException(400, "Display name must be between 1 and 50 characters")

    new_storage_name = None
    new_content_type = None
    new_storage_path = None
    if avatar and avatar.filename:
        extension = Path(avatar.filename).suffix.lower()
        content_type = (avatar.content_type or "").lower()
        if (
            content_type not in ALLOWED_AVATAR_TYPES
            or extension not in ALLOWED_AVATAR_TYPES[content_type]
        ):
            await avatar.close()
            raise HTTPException(400, "Profile photo must be a JPG, PNG, or WebP image")
        new_storage_name = f"{uuid.uuid4().hex}{extension}"
        new_content_type = content_type
        new_storage_path = settings.avatar_dir / new_storage_name
        size = 0
        try:
            with new_storage_path.open("wb") as output:
                while chunk := await avatar.read(256 * 1024):
                    size += len(chunk)
                    if size > settings.max_avatar_bytes:
                        raise HTTPException(
                            413,
                            f"Profile photo is larger than "
                            f"{settings.max_avatar_bytes // (1024 * 1024)} MB",
                        )
                    output.write(chunk)
        except Exception:
            new_storage_path.unlink(missing_ok=True)
            raise
        finally:
            await avatar.close()

    updated_at = int(time.time())
    old_storage_name = None
    try:
        with db() as connection:
            existing = connection.execute(
                "SELECT avatar_storage_name FROM users WHERE id = %s",
                (user["id"],),
            ).fetchone()
            old_storage_name = existing["avatar_storage_name"]
            should_replace = bool(new_storage_name) or remove_avatar
            row = connection.execute(
                """
                UPDATE users
                SET display_name = %s,
                    avatar_storage_name = CASE WHEN %s THEN %s ELSE avatar_storage_name END,
                    avatar_content_type = CASE WHEN %s THEN %s ELSE avatar_content_type END,
                    profile_updated_at = %s
                WHERE id = %s
                RETURNING id, username, display_name, is_admin,
                          avatar_storage_name, profile_updated_at
                """,
                (
                    clean_name,
                    should_replace,
                    new_storage_name,
                    should_replace,
                    new_content_type,
                    updated_at,
                    user["id"],
                ),
            ).fetchone()
    except Exception:
        if new_storage_path:
            new_storage_path.unlink(missing_ok=True)
        raise

    if (new_storage_name or remove_avatar) and old_storage_name:
        (settings.avatar_dir / old_storage_name).unlink(missing_ok=True)

    result = public_user(dict(row))
    await manager.send_to_users(
        manager.online_user_ids(),
        {"type": "profile_updated", "user": result},
    )
    return result


@app.get("/api/users/{user_id}/avatar")
def user_avatar(user_id: int, request: Request) -> FileResponse:
    user_from_request(request)
    with db() as connection:
        row = connection.execute(
            """
            SELECT avatar_storage_name, avatar_content_type
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        ).fetchone()
    if not row or not row["avatar_storage_name"]:
        raise HTTPException(404, "Profile photo not found")
    path = settings.avatar_dir / row["avatar_storage_name"]
    if not path.is_file():
        raise HTTPException(404, "Profile photo not found")
    return FileResponse(
        path,
        media_type=row["avatar_content_type"],
        headers={
            "Cache-Control": "private, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    )


@app.post("/api/setup")
def setup(credentials: Credentials, response: Response) -> dict:
    with db() as connection:
        if connection.execute(
            "SELECT COUNT(*) AS user_count FROM users"
        ).fetchone()["user_count"]:
            raise HTTPException(409, "Setup is already complete")
        row = connection.execute(
            """
            INSERT INTO users (username, display_name, password_hash, is_admin, created_at)
            VALUES (%s, %s, %s, TRUE, %s)
            RETURNING id
            """,
            (
                credentials.username,
                credentials.display_name or credentials.username,
                hash_password(credentials.password),
                int(time.time()),
            ),
        ).fetchone()
        user_id = row["id"]
    response.set_cookie(
        settings.session_cookie_name,
        make_session(user_id),
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="strict",
        max_age=settings.session_age_seconds,
    )
    return {"ok": True}


@app.post("/api/login")
def login(credentials: Credentials, response: Response) -> dict:
    with db() as connection:
        row = connection.execute(
            "SELECT id, password_hash FROM users WHERE LOWER(username) = LOWER(%s)",
            (credentials.username,),
        ).fetchone()
    if not row or not password_matches(credentials.password, row["password_hash"]):
        raise HTTPException(401, "Incorrect username or password")
    response.set_cookie(
        settings.session_cookie_name,
        make_session(row["id"]),
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="strict",
        max_age=settings.session_age_seconds,
    )
    return {"ok": True}


@app.post("/api/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(settings.session_cookie_name)
    return {"ok": True}


@app.post("/api/password")
def change_password(passwords: PasswordChangeInput, request: Request) -> dict:
    user = user_from_request(request)
    with db() as connection:
        row = connection.execute(
            "SELECT password_hash FROM users WHERE id = %s",
            (user["id"],),
        ).fetchone()
        if not row or not password_matches(
            passwords.current_password, row["password_hash"]
        ):
            raise HTTPException(400, "Current password is incorrect")
        if password_matches(passwords.new_password, row["password_hash"]):
            raise HTTPException(
                400, "New password must be different from the current password"
            )
        connection.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (hash_password(passwords.new_password), user["id"]),
        )
    return {"ok": True}


@app.post("/api/users/{user_id}/password")
def reset_user_password(
    user_id: int, passwords: PasswordResetInput, request: Request
) -> dict:
    admin = user_from_request(request)
    if not admin["is_admin"]:
        raise HTTPException(403, "Administrator access required")
    if user_id == admin["id"]:
        raise HTTPException(400, "Use Change password for your own account")
    with db() as connection:
        target = connection.execute(
            "SELECT id, is_admin FROM users WHERE id = %s",
            (user_id,),
        ).fetchone()
        if not target:
            raise HTTPException(404, "Family member not found")
        if target["is_admin"]:
            raise HTTPException(403, "Another administrator password cannot be reset")
        connection.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (hash_password(passwords.new_password), user_id),
        )
    return {"ok": True}


@app.post("/api/users")
def create_user(credentials: Credentials, request: Request) -> dict:
    user = user_from_request(request)
    if not user["is_admin"]:
        raise HTTPException(403, "Administrator access required")
    try:
        with db() as connection:
            connection.execute(
                """
                INSERT INTO users (username, display_name, password_hash, is_admin, created_at)
                VALUES (%s, %s, %s, FALSE, %s)
                """,
                (
                    credentials.username,
                    credentials.display_name or credentials.username,
                    hash_password(credentials.password),
                    int(time.time()),
                ),
            )
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, "That username is already used") from None
    return {"ok": True}


@app.get("/api/contacts")
def contacts(request: Request) -> list[dict]:
    user = user_from_request(request)
    with db() as connection:
        rows = connection.execute(
            """
            SELECT
                users.id,
                users.username,
                users.display_name,
                users.last_seen,
                users.avatar_storage_name,
                users.profile_updated_at,
                COALESCE(unread.unread_count, 0) AS unread_count,
                latest.body AS last_message_body,
                latest.attachment_name AS last_message_attachment_name,
                latest.deleted_at AS last_message_deleted_at,
                latest.user_id AS last_message_user_id,
                latest.created_at AS last_message_at,
                latest.delivered_at AS last_message_delivered_at,
                latest.read_at AS last_message_read_at
            FROM users
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS unread_count
                FROM messages
                WHERE
                    messages.user_id = users.id
                    AND messages.recipient_id = %s
                    AND messages.read_at IS NULL
            ) unread ON TRUE
            LEFT JOIN LATERAL (
                SELECT
                    messages.body,
                    messages.attachment_name,
                    messages.deleted_at,
                    messages.user_id,
                    messages.created_at,
                    messages.delivered_at,
                    messages.read_at
                FROM messages
                WHERE
                    (messages.user_id = users.id AND messages.recipient_id = %s)
                    OR (messages.user_id = %s AND messages.recipient_id = users.id)
                ORDER BY messages.id DESC
                LIMIT 1
            ) latest ON TRUE
            WHERE users.id <> %s
            ORDER BY latest.created_at DESC NULLS LAST, LOWER(users.display_name)
            """,
            (user["id"], user["id"], user["id"], user["id"]),
        ).fetchall()
    result = []
    for row in rows:
        contact = dict(row)
        contact["avatar_url"] = avatar_url(contact)
        contact.pop("avatar_storage_name", None)
        contact.pop("profile_updated_at", None)
        contact["is_online"] = manager.is_online(row["id"])
        result.append(contact)
    return result


@app.get("/api/messages/{contact_id}")
def messages(contact_id: int, request: Request) -> list[dict]:
    user = user_from_request(request)
    if contact_id == user["id"]:
        raise HTTPException(400, "Choose another family member")
    with db() as connection:
        contact = connection.execute(
            "SELECT id FROM users WHERE id = %s",
            (contact_id,),
        ).fetchone()
        if not contact:
            raise HTTPException(404, "Family member not found")
        rows = connection.execute(
            """
            SELECT
                messages.id,
                messages.user_id,
                messages.recipient_id,
                users.display_name,
                messages.body,
                messages.created_at,
                messages.delivered_at,
                messages.read_at,
                messages.reply_to_id,
                replied.body AS reply_body,
                replied.attachment_name AS reply_attachment_name,
                replied_user.display_name AS reply_display_name,
                replied.deleted_at AS reply_deleted_at,
                messages.edited_at,
                messages.deleted_at,
                messages.attachment_name,
                messages.attachment_storage_name,
                messages.attachment_content_type,
                messages.attachment_size
            FROM messages
            JOIN users ON users.id = messages.user_id
            LEFT JOIN messages replied ON replied.id = messages.reply_to_id
            LEFT JOIN users replied_user ON replied_user.id = replied.user_id
            WHERE
                (messages.user_id = %s AND messages.recipient_id = %s)
                OR (messages.user_id = %s AND messages.recipient_id = %s)
            ORDER BY messages.id DESC
            LIMIT 100
            """,
            (user["id"], contact_id, contact_id, user["id"]),
        ).fetchall()
    return [public_message(row) for row in reversed(rows)]


@app.post("/api/messages/{contact_id}/read")
async def mark_messages_read(contact_id: int, request: Request) -> dict:
    user = user_from_request(request)
    read_at = int(time.time())
    with db() as connection:
        rows = connection.execute(
            """
            UPDATE messages
            SET read_at = %s, delivered_at = COALESCE(delivered_at, %s)
            WHERE user_id = %s AND recipient_id = %s AND read_at IS NULL
            RETURNING id
            """,
            (read_at, read_at, contact_id, user["id"]),
        ).fetchall()
    if rows:
        await manager.send_to_users(
            {contact_id},
            {
                "type": "messages_read",
                "reader_id": user["id"],
                "message_ids": [row["id"] for row in rows],
                "read_at": read_at,
            },
        )
    return {"updated": len(rows)}


@app.post("/api/messages")
async def send_message(message: MessageInput, request: Request) -> dict:
    user = user_from_request(request)
    if message.recipient_id == user["id"]:
        raise HTTPException(400, "You cannot message yourself")
    body = message.body.strip()
    if not body:
        raise HTTPException(422, "Message cannot be empty")
    created_at = int(time.time())
    with db() as connection:
        recipient = connection.execute(
            "SELECT id FROM users WHERE id = %s",
            (message.recipient_id,),
        ).fetchone()
        if not recipient:
            raise HTTPException(404, "Family member not found")
        reply = None
        if message.reply_to_id is not None:
            reply = connection.execute(
                """
                SELECT
                    messages.id,
                    messages.body,
                    messages.attachment_name,
                    messages.deleted_at,
                    users.display_name
                FROM messages
                JOIN users ON users.id = messages.user_id
                WHERE messages.id = %s
                  AND (
                    (messages.user_id = %s AND messages.recipient_id = %s)
                    OR (messages.user_id = %s AND messages.recipient_id = %s)
                  )
                """,
                (
                    message.reply_to_id,
                    user["id"],
                    message.recipient_id,
                    message.recipient_id,
                    user["id"],
                ),
            ).fetchone()
            if not reply:
                raise HTTPException(400, "Reply message is not in this conversation")
        row = connection.execute(
            """
            INSERT INTO messages (
                user_id, recipient_id, body, created_at, delivered_at, reply_to_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, delivered_at
            """,
            (
                user["id"],
                message.recipient_id,
                body,
                created_at,
                created_at if manager.is_online(message.recipient_id) else None,
                message.reply_to_id,
            ),
        ).fetchone()
    result = {
        "id": row["id"],
        "user_id": user["id"],
        "recipient_id": message.recipient_id,
        "display_name": user["display_name"],
        "body": body,
        "created_at": created_at,
        "delivered_at": row["delivered_at"],
        "read_at": None,
        "reply_to_id": message.reply_to_id,
        "reply_body": reply["body"] if reply else None,
        "reply_attachment_name": reply["attachment_name"] if reply else None,
        "reply_display_name": reply["display_name"] if reply else None,
        "reply_deleted_at": reply["deleted_at"] if reply else None,
        "edited_at": None,
        "deleted_at": None,
        "attachment_name": None,
        "attachment_content_type": None,
        "attachment_size": None,
        "attachment_url": None,
    }
    await manager.send_to_users(
        {user["id"], message.recipient_id},
        {"type": "message", "message": result},
    )
    await send_push(message.recipient_id, user, result)
    return result


@app.post("/api/messages/attachment")
async def send_attachment(
    request: Request,
    recipient_id: int = Form(..., gt=0),
    body: str = Form(default="", max_length=4000),
    reply_to_id: int | None = Form(default=None, gt=0),
    attachment: UploadFile = File(...),
) -> dict:
    user = user_from_request(request)
    if recipient_id == user["id"]:
        raise HTTPException(400, "You cannot message yourself")

    original_name = Path(attachment.filename or "").name.strip()
    content_type = (attachment.content_type or "").lower()
    extension = Path(original_name).suffix.lower()
    if (
        not original_name
        or content_type not in ALLOWED_ATTACHMENT_TYPES
        or extension not in ALLOWED_ATTACHMENT_TYPES[content_type]
    ):
        raise HTTPException(400, "This file type is not allowed")

    storage_name = f"{uuid.uuid4().hex}{extension}"
    storage_path = settings.upload_dir / storage_name
    size = 0
    try:
        with storage_path.open("wb") as output:
            while chunk := await attachment.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_attachment_bytes:
                    raise HTTPException(
                        413,
                        f"File is larger than {settings.max_attachment_bytes // (1024 * 1024)} MB",
                    )
                output.write(chunk)
    except Exception:
        storage_path.unlink(missing_ok=True)
        raise
    finally:
        await attachment.close()

    created_at = int(time.time())
    clean_body = body.strip()
    try:
        with db() as connection:
            recipient = connection.execute(
                "SELECT id FROM users WHERE id = %s",
                (recipient_id,),
            ).fetchone()
            if not recipient:
                raise HTTPException(404, "Family member not found")
            reply = None
            if reply_to_id is not None:
                reply = connection.execute(
                    """
                    SELECT
                        messages.id,
                        messages.body,
                        messages.attachment_name,
                        messages.deleted_at,
                        users.display_name
                    FROM messages
                    JOIN users ON users.id = messages.user_id
                    WHERE messages.id = %s
                      AND (
                        (messages.user_id = %s AND messages.recipient_id = %s)
                        OR (messages.user_id = %s AND messages.recipient_id = %s)
                      )
                    """,
                    (reply_to_id, user["id"], recipient_id, recipient_id, user["id"]),
                ).fetchone()
                if not reply:
                    raise HTTPException(
                        400, "Reply message is not in this conversation"
                    )
            row = connection.execute(
                """
                INSERT INTO messages (
                    user_id,
                    recipient_id,
                    body,
                    created_at,
                    delivered_at,
                    reply_to_id,
                    attachment_name,
                    attachment_storage_name,
                    attachment_content_type,
                    attachment_size
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, delivered_at
                """,
                (
                    user["id"],
                    recipient_id,
                    clean_body,
                    created_at,
                    created_at if manager.is_online(recipient_id) else None,
                    reply_to_id,
                    original_name[:255],
                    storage_name,
                    content_type,
                    size,
                ),
            ).fetchone()
    except Exception:
        storage_path.unlink(missing_ok=True)
        raise

    result = {
        "id": row["id"],
        "user_id": user["id"],
        "recipient_id": recipient_id,
        "display_name": user["display_name"],
        "body": clean_body,
        "created_at": created_at,
        "delivered_at": row["delivered_at"],
        "read_at": None,
        "reply_to_id": reply_to_id,
        "reply_body": reply["body"] if reply else None,
        "reply_attachment_name": reply["attachment_name"] if reply else None,
        "reply_display_name": reply["display_name"] if reply else None,
        "reply_deleted_at": reply["deleted_at"] if reply else None,
        "edited_at": None,
        "deleted_at": None,
        "attachment_name": original_name[:255],
        "attachment_content_type": content_type,
        "attachment_size": size,
        "attachment_url": f"/api/messages/{row['id']}/attachment",
    }
    await manager.send_to_users(
        {user["id"], recipient_id},
        {"type": "message", "message": result},
    )
    await send_push(recipient_id, user, result)
    return result


@app.get("/api/messages/{message_id}/attachment")
def download_attachment(message_id: int, request: Request) -> FileResponse:
    user = user_from_request(request)
    with db() as connection:
        row = connection.execute(
            """
            SELECT
                user_id,
                recipient_id,
                attachment_name,
                attachment_storage_name,
                attachment_content_type,
                deleted_at
            FROM messages
            WHERE id = %s
            """,
            (message_id,),
        ).fetchone()
    if (
        not row
        or user["id"] not in {row["user_id"], row["recipient_id"]}
        or not row["attachment_storage_name"]
        or row["deleted_at"]
    ):
        raise HTTPException(404, "Attachment not found")
    path = settings.upload_dir / row["attachment_storage_name"]
    if not path.is_file():
        raise HTTPException(404, "Attachment file is missing")
    return FileResponse(
        path,
        media_type=row["attachment_content_type"],
        filename=row["attachment_name"],
        content_disposition_type=(
            "inline"
            if row["attachment_content_type"].startswith("image/")
            else "attachment"
        ),
        headers={"X-Content-Type-Options": "nosniff"},
    )


@app.patch("/api/messages/{message_id}")
async def edit_message(
    message_id: int, message: MessageEditInput, request: Request
) -> dict:
    user = user_from_request(request)
    body = message.body.strip()
    if not body:
        raise HTTPException(422, "Message cannot be empty")
    edited_at = int(time.time())
    with db() as connection:
        row = connection.execute(
            """
            UPDATE messages
            SET body = %s, edited_at = %s
            WHERE id = %s AND user_id = %s AND deleted_at IS NULL
            RETURNING recipient_id
            """,
            (body, edited_at, message_id, user["id"]),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Message not found or cannot be edited")
    payload = {
        "type": "message_edited",
        "message_id": message_id,
        "body": body,
        "edited_at": edited_at,
    }
    await manager.send_to_users({user["id"], row["recipient_id"]}, payload)
    return payload


@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: int, request: Request) -> dict:
    user = user_from_request(request)
    deleted_at = int(time.time())
    with db() as connection:
        row = connection.execute(
            """
            UPDATE messages
            SET body = '', deleted_at = %s, edited_at = NULL
            WHERE id = %s AND user_id = %s AND deleted_at IS NULL
            RETURNING recipient_id, attachment_storage_name
            """,
            (deleted_at, message_id, user["id"]),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Message not found or cannot be deleted")
    if row["attachment_storage_name"]:
        (settings.upload_dir / row["attachment_storage_name"]).unlink(
            missing_ok=True
        )
    payload = {
        "type": "message_deleted",
        "message_id": message_id,
        "deleted_at": deleted_at,
    }
    await manager.send_to_users({user["id"], row["recipient_id"]}, payload)
    return payload


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    user = get_user(
        session_user_id(websocket.cookies.get(settings.session_cookie_name))
    )
    if not user:
        await websocket.close(code=1008)
        return
    was_online = manager.is_online(user["id"])
    await manager.connect(user["id"], websocket)
    if not was_online:
        await manager.broadcast_presence(user["id"], True, None)

    delivered_at = int(time.time())
    with db() as connection:
        delivered_rows = connection.execute(
            """
            UPDATE messages
            SET delivered_at = %s
            WHERE recipient_id = %s AND delivered_at IS NULL
            RETURNING id, user_id
            """,
            (delivered_at, user["id"]),
        ).fetchall()
    delivered_by_sender: dict[int, list[int]] = {}
    for row in delivered_rows:
        delivered_by_sender.setdefault(row["user_id"], []).append(row["id"])
    for sender_id, message_ids in delivered_by_sender.items():
        await manager.send_to_users(
            {sender_id},
            {
                "type": "messages_delivered",
                "recipient_id": user["id"],
                "message_ids": message_ids,
                "delivered_at": delivered_at,
            },
        )

    try:
        while True:
            event = await websocket.receive_json()
            if event.get("type") != "typing":
                continue
            recipient_id = event.get("recipient_id")
            if not isinstance(recipient_id, int) or recipient_id == user["id"]:
                continue
            await manager.send_to_users(
                {recipient_id},
                {
                    "type": "typing",
                    "user_id": user["id"],
                    "recipient_id": recipient_id,
                    "is_typing": bool(event.get("is_typing")),
                },
            )
    except WebSocketDisconnect:
        pass
    finally:
        went_offline = manager.disconnect(user["id"], websocket)
        if went_offline:
            last_seen = int(time.time())
            with db() as connection:
                connection.execute(
                    "UPDATE users SET last_seen = %s WHERE id = %s",
                    (last_seen, user["id"]),
                )
            await manager.broadcast_presence(user["id"], False, last_seen)
