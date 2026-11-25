# Installation and standalone use

[Ελληνικά](INSTALL.el.md) · [Project](../README.md)

## Static hosting

Extract the application release ZIP. Serve its contents over HTTPS, with `index.html` at the chosen web root and `en/index.html` one directory below. Keep the assets and catalog in the supplied layout. No runtime server dependencies are required. Both live pages load the same catalog and application modules. If self-hosting for public discovery, use the proper canonical origin and path in `config.json` and regenerate the HTML using the source build. The distributed release targets `https://dos.gr/seismo/` for canonical URLs.

For local use, start any static file server from the extracted directory. For example, if Python is available locally:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` or `http://127.0.0.1:8000/en/`. Use HTTPS on a non-local server. Outbound access depends on the browser, provider policies, and CORS. HTTP FDSN is used on demand. Provider restrictions still apply when self-hosting.

## Standalone HTML

Open `SEISMO-Phase-5-preview.html`. For live rounds under `file:`, select the supplied `stations.txt`. This requires browser support for Web Crypto, plus provider support for the file origin. Localhost is an alternative. The included archival example can be recalculated separately, and a saved live JSON can be checked using its original miniSEED attachments.

## Editable source

The repository includes `src/`, `build.py`, `artwork.py` and the original configuration. A build requires local Python, Pillow and lxml, with DejaVu Sans at the paths specified in `artwork.py`. Run `python3 build.py` to regenerate the static output in `dist/seismo/`. Install from the release ZIP to use the published static files directly. The archived Phase 5 distribution and its publication scripts may refer to the earlier phase bundles.
