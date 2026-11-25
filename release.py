"""Package the static distribution and preserve the previous releases."""
from pathlib import Path
import shutil
from zipfile import ZipFile, ZIP_DEFLATED, ZIP_STORED

from build import main as build

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "dist" / "seismo"
ARCHIVE = "SEISMO-Phase-4.zip"

def previous_release():
    for path in (ROOT / "phases" / ARCHIVE, ROOT.parent / "phase4" / ARCHIVE):
        if path.is_file():
            return path
    raise FileNotFoundError(ARCHIVE)

def release():
    build()
    resources = ("README.md", "LICENSE", "NOTICE.md", "ALGORITHM.md", "SEISMO-Phase-5.md",
                 "stations.txt", "config.json", "build.py", "artwork.py", "release.py")
    with ZipFile(SITE / "SEISMO-source.zip", "w", ZIP_DEFLATED, compresslevel=7) as archive:
        for resource in resources:
            archive.write(ROOT / resource, resource)
        for folder in ("src", "evidence"):
            for file in sorted((ROOT / folder).rglob("*")):
                if file.is_file() and "__pycache__" not in file.parts:
                    archive.write(file, file.relative_to(ROOT))
        archive.write(previous_release(), "phases/" + ARCHIVE, compress_type=ZIP_STORED)
    for filename in ("README.md", "SEISMO-Phase-5.md", "SEISMO-Phase-5-preview.html"):
        shutil.copy2(ROOT / filename, SITE / filename)
    with ZipFile(ROOT / "SEISMO-Phase-5.zip", "w", ZIP_DEFLATED, compresslevel=7) as archive:
        for file in sorted(SITE.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(SITE),
                              compress_type=ZIP_STORED if file.suffix == ".zip" else ZIP_DEFLATED)

if __name__ == "__main__":
    release()
