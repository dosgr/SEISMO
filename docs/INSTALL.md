[Ελληνικά](INSTALL.el.md)

# SEISMO v1.1.1 · cPanel installation

1. Open the existing `seismo/` folder in the `dos.gr` document root in **File Manager**. Back up its current files.
2. Upload `SEISMO-v1.1.1-public.zip` into that folder and extract there, replacing the matching application files. The ZIP has `index.html` and `stations.txt` at its root and the English page at `en/index.html`.
3. Open [Greek](https://dos.gr/seismo/) and [English](https://dos.gr/seismo/en/). Verify the unchanged station catalog **1.1.0**, language switching and SPIN. Check any host-level robots rules or stale cache if publication differs from the packaged metadata.

The application requires static HTTPS hosting only. See the [algorithm](ALGORITHM.md), [Phase 9 measurements and provider limitations](PHASE-9.el.md) and [attribution](NOTICE.en.md).

[Optional support configuration](SUPPORT.md).
