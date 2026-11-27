[Ελληνικά](README.el.md) · **English**

# SEISMO — The Pulse of the Earth!

![Earth above a roulette wheel crossed by a seismic waveform, with the SEISMO mark and the Greek flag](images/social-en.jpg)

[![Code: AGPL v3](https://img.shields.io/badge/code-AGPL%20v3-327653)](LICENSE)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC%20BY--SA%204.0-37617e)](LICENSE-CONTENT.md)
[![Vanilla JavaScript](https://img.shields.io/badge/browser-Vanilla%20JavaScript-e4b858)](js/)

**Born in Greece, Powered by Earth.**

[Open SEISMO in English](https://dos.gr/seismo/en/) · [Άνοιξε τη Σεισμορουλέτα στα ελληνικά](https://dos.gr/seismo/)

SEISMO is a free, open-source experiment that connects seismology, mathematics, technology, education, and play. Press **SPIN** and the browser commits to a future UTC interval. It requests near-real-time measurements from Greek and international seismic networks. If three distinct stations provide complete coverage on time, a reproducible calculation maps their integer samples to a number from 0 to 36. Otherwise the round ends with **NO RESULT**.

- Each visitor starts and verifies their own rounds. Windows may overlap and outcomes need not be statistically independent.
- The browser uses standard HTML5, CSS3 and Vanilla JavaScript. Stations and backup priorities are in [stations.txt](stations.txt).
- Greek and English pages share the same calculation. A round export records the catalog fingerprint, sample evidence, and result.
- Chips are virtual. There are no payments, subscriptions, monetary bets, or prizes.

## Release v1.1.0

Greek First – Global Fallback prioritizes physical stations in Greece via EarthScope and EPOS France. SCEDC and international EarthScope offer short-round fallback, while GEOFON remains available in the 330-second diagnostics. The UI shows the station's country separately from its provider, UTC sample age, response time, and coverage. In the November 27, 2026 browser session, all five 20-second rounds completed with Greek data. The selected samples were 6.93–10.32 seconds old on receipt. See the [algorithm and verification notes](docs/ALGORITHM.md) and the [installation guide](docs/INSTALL.md).

[Official repository](https://github.com/dosgr/SEISMO) · [(ↄ) Copyleft](https://en.wikipedia.org/wiki/Copyleft)

## Use and verify

| Guide | English | Ελληνικά |
|---|---|---|
| Install or run locally | [Installation](docs/INSTALL.md) | [Εγκατάσταση](docs/INSTALL.el.md) |
| Compute and verify a result | [Algorithm](docs/ALGORITHM.md) | [Αλγόριθμος](ALGORITHM.md) |
| Design, evidence, and scientific limits | [Technical notes](docs/SCIENCE.md) | [Τεχνική έκθεση](docs/PHASE-5.el.md) |
| Third-party data and visuals | [Attribution](docs/NOTICE.en.md) | [Απόδοση](NOTICE.md) |

**Idea & Creation** — Lykourgos Kekempanos | [Lyk.Gr](https://lyk.gr/)  
With the assistance of GPT artificial intelligence.  
Copyleft 2026 — AGPL v3 / CC BY-SA 4.0.

[Download the production ZIP](https://github.com/dosgr/SEISMO/releases/download/v1.1.0/SEISMO-v1.1.0-cPanel.zip) · [Phase 9 measurements and provider limits](docs/PHASE-9.el.md)

## Browser interface

![Screenshot of the live English SEISMO browser interface](docs/browser-en.jpg)
