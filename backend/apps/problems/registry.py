import os
from django.conf import settings
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class LanguageConfig:
    name: str
    slug: str
    extension: str


class LanguageRegistry:
    """
    Registry for supported programming languages.
    Replaces the database-driven ProgrammingLanguage model.
    """

    LANGUAGES = [
        LanguageConfig(name="Python", slug="python", extension="py"),
        LanguageConfig(name="JavaScript", slug="javascript", extension="js"),
        LanguageConfig(name="C++", slug="cpp", extension="cpp"),
        LanguageConfig(name="Java", slug="java", extension="java"),
    ]

    _languages_by_slug = {lang.slug: lang for lang in LANGUAGES}

    @classmethod
    def get_all_languages(cls) -> List[LanguageConfig]:
        return cls.LANGUAGES

    @classmethod
    def get_language(cls, slug: str) -> Optional[LanguageConfig]:
        return cls._languages_by_slug.get(slug)

    @classmethod
    def get_boilerplate(cls, slug: str) -> str:
        return cls._read_template(slug, "boilerplate")

    @classmethod
    def get_driver_template(cls, slug: str) -> str:
        return cls._read_template(slug, "driver")

    @staticmethod
    def _read_template(slug: str, template_type: str) -> str:
        """
        Reads the template file for a given language and type.
        template_type should be 'boilerplate' or 'driver'.
        """
        # Define the base path for templates
        # Assumes structure: backend/apps/problems/templates/languages/<slug>/<type>.txt
        base_path = os.path.join(
            settings.BASE_DIR, "apps", "problems", "templates", "languages"
        )

        # Construct file path
        filename = "boilerplate.txt" if template_type == "boilerplate" else "driver.txt"
        file_path = os.path.join(base_path, slug, filename)

        try:
            with open(file_path, "r") as f:
                return f.read()
        except FileNotFoundError:
            # Log error or handle gracefully
            print(f"Template not found: {file_path}")
            return ""
