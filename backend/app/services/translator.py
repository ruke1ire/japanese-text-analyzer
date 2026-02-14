from typing import Optional
import os
from app.config import TRANSLATION_METHOD, DEEPL_API_KEY
from app.schemas import TranslateResponse


class NullTranslator:
    """Translator that returns None (no translation)"""

    def translate(self, text: str, source: str = "ja", target: str = "en") -> TranslateResponse:
        return TranslateResponse(
            original=text,
            translation=None,
            method="none"
        )


class DeepLTranslator:
    """Translator using DeepL API"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        if not api_key:
            raise ValueError("DeepL API key is required")

    def translate(self, text: str, source: str = "ja", target: str = "en") -> TranslateResponse:
        import requests

        try:
            # DeepL requires specific target language variants
            target_lang = target.upper()
            if target_lang == "EN":
                target_lang = "EN-US"

            # Use header-based authentication (new DeepL API requirement)
            response = requests.post(
                "https://api-free.deepl.com/v2/translate",
                headers={
                    "Authorization": f"DeepL-Auth-Key {self.api_key}"
                },
                data={
                    "text": text,
                    "source_lang": source.upper(),
                    "target_lang": target_lang
                },
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            translation = result["translations"][0]["text"]

            return TranslateResponse(
                original=text,
                translation=translation,
                method="deepl"
            )
        except Exception as e:
            # If translation fails, return None
            return TranslateResponse(
                original=text,
                translation=f"Translation error: {str(e)}",
                method="deepl_error"
            )


class LlamaCppTranslator:
    """Translator using local llama.cpp server with LFM2-350M-ENJP-MT model"""

    def __init__(self, server_url: str = "http://llamacpp:8080"):
        self.server_url = server_url

    def translate(self, text: str, source: str = "ja", target: str = "en") -> TranslateResponse:
        import requests

        try:
            # Use chat completions endpoint with system prompt
            response = requests.post(
                f"{self.server_url}/v1/chat/completions",
                json={
                    "messages": [
                        {"role": "system", "content": "Translate to English."},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 512
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            translation = result["choices"][0]["message"]["content"].strip()

            return TranslateResponse(
                original=text,
                translation=translation,
                method="llamacpp"
            )
        except Exception as e:
            # If translation fails, return error
            return TranslateResponse(
                original=text,
                translation=f"Translation error: {str(e)}",
                method="llamacpp_error"
            )


class TranslatorFactory:
    """Factory for creating appropriate translator based on config"""

    @staticmethod
    def create():
        """Create translator based on config"""
        if TRANSLATION_METHOD == "llamacpp":
            llamacpp_url = os.getenv("LLAMACPP_URL", "http://llamacpp:8080")
            return LlamaCppTranslator(llamacpp_url)
        elif TRANSLATION_METHOD == "deepl" and DEEPL_API_KEY:
            return DeepLTranslator(DEEPL_API_KEY)
        # Default to null translator
        return NullTranslator()

    @staticmethod
    def create_by_method(method: str):
        """
        Create translator by explicit method name

        Args:
            method: Translation method (none, deepl, llamacpp)

        Returns:
            Translator instance
        """
        method = method.lower()

        if method == "llamacpp":
            llamacpp_url = os.getenv("LLAMACPP_URL", "http://llamacpp:8080")
            return LlamaCppTranslator(llamacpp_url)
        elif method == "deepl":
            api_key = DEEPL_API_KEY
            if not api_key:
                # Return translator that will return an error
                return NullTranslator()
            return DeepLTranslator(api_key)
        else:  # "none" or any other value
            return NullTranslator()


# Singleton instance
_translator_instance = None


def get_translator(method: Optional[str] = None):
    """
    Get translator instance

    Args:
        method: Translation method to use (none, deepl, llamacpp)
                If None, uses the default from config

    Returns:
        Translator instance
    """
    if method:
        # Dynamic translator based on requested method
        return TranslatorFactory.create_by_method(method)

    # Use singleton for default translator
    global _translator_instance
    if _translator_instance is None:
        _translator_instance = TranslatorFactory.create()
    return _translator_instance
