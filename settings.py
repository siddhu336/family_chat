import secrets
from functools import cached_property
from pathlib import Path
from urllib.parse import quote

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_title: str = "Family Chat"
    postgres_db: str = "family_chat"
    postgres_user: str = "family_chat"
    postgres_password: str = "family_chat"
    postgres_host: str = "localhost"
    postgres_port: int = Field(default=5432, ge=1, le=65535)
    family_chat_secret: str | None = None
    session_cookie_name: str = "family_session"
    session_age_seconds: int = Field(default=60 * 60 * 24 * 30, gt=0)
    session_cookie_secure: bool = False
    max_attachment_bytes: int = Field(default=10 * 1024 * 1024, gt=0)
    max_voice_seconds: int = Field(default=300, ge=5, le=1800)
    image_max_dimension: int = Field(default=1920, ge=640, le=4096)
    image_compression_quality: float = Field(default=0.82, ge=0.5, le=0.95)
    max_avatar_bytes: int = Field(default=2 * 1024 * 1024, gt=0)
    vapid_private_key: str | None = None
    vapid_public_key: str | None = None
    vapid_subject: str = "mailto:admin@example.com"
    webauthn_rp_id: str = "localhost"
    webauthn_rp_name: str = "Family Chat"
    webauthn_origin: str = "http://localhost:8765"
    public_url: str = "http://localhost:8765"
    invite_expiry_seconds: int = Field(default=60 * 60 * 24 * 3, gt=0)
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_starttls: bool = True

    base_dir: Path = Path(__file__).resolve().parent

    @property
    def static_dir(self) -> Path:
        return self.base_dir / "static"

    @property
    def upload_dir(self) -> Path:
        return self.base_dir / "uploads"

    @property
    def avatar_dir(self) -> Path:
        return self.base_dir / "avatars"

    @property
    def database_url(self) -> str:
        user = quote(self.postgres_user, safe="")
        password = quote(self.postgres_password, safe="")
        database = quote(self.postgres_db, safe="")
        return (
            f"postgresql://{user}:{password}@"
            f"{self.postgres_host}:{self.postgres_port}/{database}"
        )

    @property
    def secret_path(self) -> Path:
        return self.base_dir / ".family_chat_secret"

    @cached_property
    def secret_key(self) -> bytes:
        if self.family_chat_secret:
            return self.family_chat_secret.encode()
        if self.secret_path.exists():
            return self.secret_path.read_text(encoding="ascii").strip().encode()
        generated = secrets.token_hex(32)
        self.secret_path.write_text(generated, encoding="ascii")
        return generated.encode()


settings = Settings()
