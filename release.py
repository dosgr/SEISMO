"""Build the production static site and its cPanel and source archives."""
from pathlib import Path
from shutil import copyfile
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile

from build import main as build

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "dist" / "seismo"
VERSION = "1.1.0"
DEPLOYMENT = f"SEISMO-v{VERSION}-cPanel.zip"
BASE_FILES = (
    "README.md", "README.el.md", "ALGORITHM.md", "CHANGELOG.md", "CONTRIBUTING.md",
    "LICENSE", "LICENSE-CONTENT.md", "NOTICE.md", "artwork.py", "build.py",
    "config.json", "release.py", "stations.txt",
)


def release():
    build()
    for name in ("LICENSE-CONTENT.md", f"SEISMO-v{VERSION}-preview.html"):
        copyfile(ROOT / name, SITE / name)
    docs = SITE / "docs"
    docs.mkdir(exist_ok=True)
    for name in ("INSTALL.el.md", "INSTALL.md", "PHASE-9.el.md"):
        copyfile(ROOT / "docs" / name, docs / name)
    with ZipFile(SITE / "SEISMO-source.zip", "w", ZIP_DEFLATED) as archive:
        for name in BASE_FILES:
            archive.write(ROOT / name, name)
        for folder in ("src", "docs", "evidence", "diagnostics"):
            for file in sorted((ROOT / folder).rglob("*")):
                if file.is_file() and "__pycache__" not in file.parts:
                    archive.write(file, file.relative_to(ROOT))
    with ZipFile(ROOT / DEPLOYMENT, "w", ZIP_DEFLATED) as archive:
        for file in sorted(SITE.rglob("*")):
            if file.is_file():
                compression = ZIP_STORED if file.suffix == ".zip" else ZIP_DEFLATED
                archive.write(file, file.relative_to(SITE), compress_type=compression)


if __name__ == "__main__":
    release()
