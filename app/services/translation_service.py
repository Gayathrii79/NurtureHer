import re

SUPPORTED_LANGUAGES = {
    "en": "English",
    "kn": "Kannada",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "ml": "Malayalam",
}

LANGUAGE_NAME_TO_CODE = {
    "english": "en",
    "kannada": "kn",
    "hindi": "hi",
    "tamil": "ta",
    "telugu": "te",
    "malayalam": "ml",
}

LANGUAGE_KEYWORDS = {
    "kn": {"ನಾನು", "ಆರೋಗ್ಯ", "ನೋವು", "ಗರ್ಭ", "ಹೆಣ್ಣು"},
    "hi": {"मैं", "स्वास्थ्य", "दर्द", "गर्भ", "महिला"},
    "ta": {"நான்", "ஆரோக்கியம்", "வலி", "கர்ப்ப", "பெண்"},
    "te": {"నేను", "ఆరోగ్యం", "నొప్పి", "గర్భం", "మహిళ"},
    "ml": {"ഞാൻ", "ആരോഗ്യം", "വേദന", "ഗർഭം", "സ്ത്രീ"},
}

# High-confidence romanized markers for transliterated inputs
ROMANIZED_ANCHORS = {
    "ta": ("enakku", "unaku", "romba", "irukku", "valikuthu", "sollunga", "mudiyala", "illaye", "tanglish"),
    "hi": ("mujhe", "bahut", "bohot", "dard", "raha hai", "rahi hai", "kya karu", "bataiye", "hinglish"),
    "kn": ("nanage", "tumba", "thumba", "hege", "madodu", "gotilla", "kanglish"),
    "te": ("naaku", "chala", "cheppandi", "teliyadu", "noppi", "teluglish"),
    "ml": ("enikku", "valare", "parayu", "enthaanu", "vedana", "manglish"),
}


class TranslationService:
    def extract_explicit_language_request(self, text: str | None) -> str | None:
        if not text:
            return None
        lower_text = text.lower()

        # 1. Action patterns: e.g. "reply in kannada", "answer in tamil", "please answer in hindi"
        pattern_action = (
            r"\b(?:reply|answer|respond|speak|write|talk|explain|tell\s+me)\s+(?:to\s+me\s+)?"
            r"(?:in\s+)?(english|kannada|hindi|tamil|telugu|malayalam)\b"
        )
        match = re.search(pattern_action, lower_text)
        if match:
            return LANGUAGE_NAME_TO_CODE.get(match.group(1))

        # 2. Preposition patterns: e.g. "in kannada please", "in hindi", "in tamil only"
        pattern_preposition = (
            r"\b(?:please\s+)?(?:in|into)\s+(english|kannada|hindi|tamil|telugu|malayalam)"
            r"(?:\s+(?:please|only|language|script|bhasha))?\b"
        )
        match = re.search(pattern_preposition, lower_text)
        if match:
            return LANGUAGE_NAME_TO_CODE.get(match.group(1))

        # 3. Native script explicit requests
        if "ಕನ್ನಡದಲ್ಲಿ" in text:
            return "kn"
        if "தமிழில்" in text:
            return "ta"
        if re.search(r"(?:हिंदी|हिन्दी)\s*में", text):
            return "hi"
        if "తెలుగులో" in text:
            return "te"
        if "മലയാളത്തിൽ" in text:
            return "ml"

        return None

    def detect_language(self, text: str | None) -> str | None:
        if not text:
            return None

        # 1. Deterministic script check (Unicode codepoint ranges)
        scores = {language: 0 for language in LANGUAGE_KEYWORDS}
        for language, keywords in LANGUAGE_KEYWORDS.items():
            scores[language] += sum(2 for keyword in keywords if keyword in text)

        for character in text:
            codepoint = ord(character)
            if 0x0C80 <= codepoint <= 0x0CFF:
                scores["kn"] += 1
            elif 0x0900 <= codepoint <= 0x097F:
                scores["hi"] += 1
            elif 0x0B80 <= codepoint <= 0x0BFF:
                scores["ta"] += 1
            elif 0x0C00 <= codepoint <= 0x0C7F:
                scores["te"] += 1
            elif 0x0D00 <= codepoint <= 0x0D7F:
                scores["ml"] += 1

        detected_script, script_score = max(scores.items(), key=lambda item: item[1])
        if script_score > 0:
            return detected_script

        # 2. Distinctive romanized anchors (Tanglish, Hinglish, etc.)
        lower_text = text.lower()
        roman_scores = {lang: 0 for lang in ROMANIZED_ANCHORS}
        for lang, anchors in ROMANIZED_ANCHORS.items():
            for anchor in anchors:
                if " " in anchor:
                    if anchor in lower_text:
                        roman_scores[lang] += 2
                else:
                    if re.search(rf"\b{anchor}\b", lower_text):
                        roman_scores[lang] += 1

        detected_roman, roman_score = max(roman_scores.items(), key=lambda item: item[1])
        if roman_score > 0:
            return detected_roman

        return None

    def normalize_language(self, language: str | None, fallback: str = "en") -> str:
        if language and language in SUPPORTED_LANGUAGES:
            return language
        return fallback if fallback in SUPPORTED_LANGUAGES else "en"

    def resolve_language(self, message: str, selected_language: str | None = None) -> tuple[str, str]:
        """
        Determine target response language according to strict 4-tier priority:
        1. Explicit language requested in user message
        2. User-selected language preference when non-English (hi, ta, te, ml, kn)
        3. Detected language of user message (native script or romanized regional language)
        4. English fallback ('en')
        """
        # Tier 1: Explicit language requested in message
        explicit = self.extract_explicit_language_request(message)
        if explicit and explicit in SUPPORTED_LANGUAGES:
            return explicit, "explicit_request"

        # Tier 2: Selected non-English UI language
        norm_selected = self.normalize_language(selected_language)
        if norm_selected != "en":
            return norm_selected, "ui_preference"

        # Tier 3: Detected language of message
        detected = self.detect_language(message)
        if detected and detected in SUPPORTED_LANGUAGES:
            return detected, "detected_input"

        # Tier 4: English fallback
        return "en", "default_fallback"

    async def translate_text(self, text: str, target_language: str) -> str:
        language = self.normalize_language(target_language)
        if language == "en":
            return text
        return f"[{language}] {text}"

