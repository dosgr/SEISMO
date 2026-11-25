# Technical and scientific notes

[Ελληνική έκθεση](PHASE-5.el.md) · [Project](../README.md)

SEISMO uses real instrument recordings. Ocean waves, weather and human activity contribute to ambient ground motion alongside earthquakes. The project combines future UTC windows, publicly documented station priorities and a reproducible numerical calculation. It makes no priority claim about similar experiments.

The current catalog enables Greek and international routes across five levels. A browser round issues bounded, grouped FDSN dataselect requests and attempts a configured WSS route. Failover and result availability depend on station coverage, network delivery and provider terms. Requests originate from the visitor's connection. The app honors local time limits, excludes stale windows and publishes **NO RESULT** when fewer than three distinct stations qualify. For continuous real-time service use appropriate authorized streaming rather than repeated FDSN polling. Provider-specific quota and redistribution rules apply.

| Phase 5 browser observation (UTC, 24 Nov 2026) | Round / window | Outcome |
|---|---|---|
| 12:43:56.650 | 20 s / 1 s | 7, via SCEDC and EarthScope backups. Independent ObsPy reproduction matched both SHA-256 values. |
| 12:44:45.950 | 20 s / 10 s | NO RESULT, insufficient window coverage. |
| 12:45:59.100 | 30 s / 1 s | 8, three displayed live waveforms. |

The first round's eligible samples arrived with last-sample ages of 5.06 s at SCEDC and 13.45 s at EarthScope. HTTP response times and sample ages represent different intervals. Those trials do not establish reliability for every location, latency, or high-volume concurrency. Local hashes support reproducibility, rather than proving statistically independent, unpredictable or manipulation-resistant physical randomness. Overlapping windows and correlated stations may yield related inputs. The application is an experiment and does not predict earthquakes.

Sources: [FDSN](https://fdsn.org/webservices/), [ORFEUS EIDA](https://www.orfeus-eu.org/data/eida/webservices/), [EarthScope](https://service.earthscope.org/fdsnws/), [SCEDC](https://service.scedc.caltech.edu/fdsnws/dataselect/1/), [USGS seismographs](https://www.usgs.gov/programs/earthquake-hazards/seismographs-keeping-track-earthquakes), [NIST SHA-256](https://csrc.nist.gov/pubs/fips/180-4/upd1/final).
