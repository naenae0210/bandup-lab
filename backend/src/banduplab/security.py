import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken


def _fernet(app_secret: str) -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(app_secret.encode()).digest())
    return Fernet(key)


def encrypt_api_key(raw_key: str, app_secret: str) -> str:
    return _fernet(app_secret).encrypt(raw_key.encode()).decode()


def decrypt_api_key(token: str, app_secret: str) -> str:
    try:
        return _fernet(app_secret).decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("저장된 키를 복호화할 수 없습니다") from exc


def mask_api_key(raw_key: str) -> str:
    if len(raw_key) <= 8:
        return "*" * len(raw_key)
    return f"{raw_key[:4]}{'*' * (len(raw_key) - 8)}{raw_key[-4:]}"
