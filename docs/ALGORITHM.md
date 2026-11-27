# SEISMO-P4 round algorithm

[Ελληνικά](../ALGORITHM.md) · [Project](../README.md)

1. The browser records acceptance in UTC milliseconds. The start is the next strict 10 ms boundary. Preselect a sample duration of 1, 3, 5, or 10 seconds and a round duration of 20, 30, 45, or 60 seconds. The cutoff is two seconds before reveal. The browser measures elapsed time monotonically and uses the device clock for its UTC reference.
2. Decode the miniSEED recordings and select precisely the samples indexed into `[start,end)` using `floor((sample_ns - start_ns) × Hz / 10^9)`. A candidate must have full, conflict-free coverage. Sort routes by catalog priority and then lexicographically by `provider~protocol~id`. Select three distinct physical stations, treating stations separated by less than 0.001° on both axes as colocated. With fewer than three, return **NO RESULT**.
3. Serialize the ASCII bytes `SEISMO-P4`, a zero byte, the fixed UTC string `YYYY-MM-DDTHH:MM:SS.mmmZ`, a zero byte and duration as an unsigned 32-bit big-endian integer. For each selected station in order append its ASCII NSLC ID, a zero byte, sampling rate as an unsigned 32-bit big-endian integer, and samples as signed 32-bit big-endian integers. Record SHA-256 of this canonical input.
4. Append a 32-bit unsigned big-endian counter starting at 0 and compute SHA-256. Scan the digest in order for the first byte below 222. Return its remainder modulo 37. If none qualifies, increase the counter and repeat. This assigns six eligible byte values to each number if the byte is uniform. The UUID, UI language, chips and catalog hash do not enter the numerical calculation.

## Independent verification

Download the round JSON and retain the exact catalog and sample evidence. The browser verifier recalculates the catalog hash, checks the selected routes and complete windows, and recomputes the fingerprints and result. Where redistribution is allowed, original recordings may be embedded. Where it is restricted, retrieve the specific files from the documented provider links and load them into the verifier. Load the saved evidence and required miniSEED files in the standalone HTML for offline verification.

Verification establishes agreement with the supplied samples and recorded eligibility. Exact receipt times are local observations, and a static browser session does not establish a permanent public transcript. The same raw samples and canonical input reproduce the same number.

## Trial networking policy in v1.1.0

The new JSON identifies the scheduling policy as `seismo-fdsn-1.1`. A browser round can also last 330 seconds. Publication waits delay the request for the same window. The browser aims to request NOA, NOA2 and GEOFON 300 seconds after that window ends, SCEDC 8.5 seconds after it ends, and EarthScope 22 seconds after it ends. Each target is capped by the cutoff and a provider-specific transport budget. The cutoff stays two seconds before reveal. For the full scheduling formula see the [Greek specification](../ALGORITHM.md). Request timing and diagnostic metadata remain outside the canonical SHA-256 input.

## Phase 9 · `seismo-greek-first-1.1`

The previous scheduling section describes the earlier release. Version 1.1.0 uses Greek EarthScope, Greek EPOS France, SCEDC, international EarthScope, and archival GEOFON in that order. Level 5 and the experimental EarthScope WSS route are reserved for the 330-second diagnostics. NOA and NOA2 remain available for manual archival checks. The same future half-open window of 1, 3, 5, or 10 seconds applies to each route. Acquisition freezes two seconds before reveal.

For levels 1–5, the target waits after window end are 7, 10, 8.5, 12 and 300 seconds. Their transport reserves are 5, 4, 3.5, 3.5 and 5 seconds. The planned send is `max(end,min(end+wait,cutoff−reserve))`. The proof records the network plan and actual request timings. Physical station IDs, network/station when IDs are absent, and near-identical coordinates prevent duplicate selection.

The result still uses `SEISMO-P4`. The spin UUID identifies the proof and is excluded from the hash input. Replay confirms the selected data and number against the recorded acquisition evidence. An independent archive re-download can confirm the waveform while the arrival time and recorded provider outcomes are client observations. See the [installation and verification guide](INSTALL.md).
