from cryptography.fernet import Fernet


def encrypt_value(plaintext: str, encryption_key: str) -> str:
    f = Fernet(encryption_key.encode())
    return f.encrypt(plaintext.encode()).decode()


def decrypt_value(ciphertext: str, encryption_key: str) -> str:
    f = Fernet(encryption_key.encode())
    return f.decrypt(ciphertext.encode()).decode()


def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "****"
    parts = key.split("-")
    if len(parts) >= 3:
        prefix = "-".join(parts[:2])
        return f"{prefix}-...****{key[-4:]}"
    return f"{key[:4]}...****{key[-4:]}"
