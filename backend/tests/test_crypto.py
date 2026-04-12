from cryptography.fernet import Fernet

from crypto import decrypt_value, encrypt_value, mask_key

# Generate a valid Fernet key for tests
TEST_KEY = Fernet.generate_key().decode()


class TestEncryptDecrypt:
    def test_roundtrip(self):
        plaintext = "sk-ant-api03-secret-key-12345"
        ciphertext = encrypt_value(plaintext, TEST_KEY)
        assert decrypt_value(ciphertext, TEST_KEY) == plaintext

    def test_different_ciphertexts_for_same_input(self):
        plaintext = "same-value"
        ct1 = encrypt_value(plaintext, TEST_KEY)
        ct2 = encrypt_value(plaintext, TEST_KEY)
        assert ct1 != ct2  # Fernet uses random IV each time

    def test_different_keys_cannot_decrypt(self):
        plaintext = "secret"
        ct = encrypt_value(plaintext, TEST_KEY)
        other_key = Fernet.generate_key().decode()
        try:
            decrypt_value(ct, other_key)
            assert False, "Should have raised"
        except Exception:
            pass


class TestMaskKey:
    def test_short_key(self):
        assert mask_key("abc") == "****"
        assert mask_key("12345678") == "****"

    def test_dash_separated_key(self):
        key = "sk-ant-api03-secret-key"
        masked = mask_key(key)
        assert masked == "sk-ant-...****-key"

    def test_plain_long_key(self):
        key = "abcdefghijklmnop"
        masked = mask_key(key)
        assert masked == "abcd...****mnop"

    def test_two_part_dash_key(self):
        key = "prefix-longvalue1234"
        masked = mask_key(key)
        assert masked == "pref...****1234"
