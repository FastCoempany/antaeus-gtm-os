#!/usr/bin/env python3
"""
SIGNAL CONSOLE — SOURCE VERIFIER
================================
Tests every Tier S free data source for the Signal Console module.
Run weekly (or on-demand) to confirm the data layer is live.

Usage:
    python signal_console_source_verifier.py
    python signal_console_source_verifier.py --json    # machine-readable output
    python signal_console_source_verifier.py --quick   # skip slow checks

Exit codes:
    0 = all critical sources live
    1 = one or more critical sources degraded
    2 = network unreachable

Requirements:
    pip install requests
"""

from __future__ import annotations
import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable

import requests

# ─────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────

# IMPORTANT: SEC EDGAR requires a real contact identifier in User-Agent.
# Replace before running in production. SEC will block generic UAs.
USER_AGENT = "Antaeus GTM OS / Signal Console verifier — antaeus@antaeus.app"

TIMEOUT_SEC = 10
HEADERS = {"User-Agent": USER_AGENT, "Accept": "application/json"}


# ─────────────────────────────────────────────────────────────────────
# RESULT TYPES
# ─────────────────────────────────────────────────────────────────────

@dataclass
class CheckResult:
    name: str
    tier: str                    # "S", "A", "B"
    category: str                # what intel category it feeds
    url: str
    ok: bool
    status_code: int | None
    latency_ms: int | None
    sample: str                  # a short sample of the response
    note: str = ""
    critical: bool = True        # if False, failure doesn't trigger exit code 1


# ─────────────────────────────────────────────────────────────────────
# CHECK PRIMITIVES
# ─────────────────────────────────────────────────────────────────────

def _probe(url: str, expect: Callable[[requests.Response], tuple[bool, str]],
           headers: dict | None = None) -> tuple[bool, int | None, int | None, str, str]:
    """Generic GET probe. Returns (ok, status, latency_ms, sample, note)."""
    h = headers or HEADERS
    t0 = time.perf_counter()
    try:
        r = requests.get(url, headers=h, timeout=TIMEOUT_SEC)
        latency = int((time.perf_counter() - t0) * 1000)
        ok, sample = expect(r)
        return ok, r.status_code, latency, sample, ""
    except requests.exceptions.Timeout:
        return False, None, None, "", f"timeout >{TIMEOUT_SEC}s"
    except requests.exceptions.ConnectionError as e:
        return False, None, None, "", f"connection error: {e.__class__.__name__}"
    except Exception as e:
        return False, None, None, "", f"{e.__class__.__name__}: {e}"


def _expect_json_list(min_len: int = 1):
    def _check(r):
        if r.status_code != 200:
            return False, f"http {r.status_code}"
        try:
            data = r.json()
        except Exception:
            return False, "non-json body"
        if isinstance(data, list) and len(data) >= min_len:
            return True, f"list[{len(data)}] e.g. {data[:3]}"
        return False, f"expected list>={min_len}, got {type(data).__name__}"
    return _check


def _expect_json_keys(*keys: str):
    def _check(r):
        if r.status_code != 200:
            return False, f"http {r.status_code}"
        try:
            data = r.json()
        except Exception:
            return False, "non-json body"
        missing = [k for k in keys if k not in data]
        if missing:
            return False, f"missing keys: {missing}"
        sample = {k: (str(data[k])[:60] if not isinstance(data[k], (list, dict))
                      else f"{type(data[k]).__name__}({len(data[k])})") for k in keys[:3]}
        return True, str(sample)
    return _check


def _expect_xml_or_atom():
    def _check(r):
        if r.status_code != 200:
            return False, f"http {r.status_code}"
        body = r.text[:200].lower()
        if "<rss" in body or "<feed" in body or "<?xml" in body:
            # count items roughly
            items = r.text.count("<item>") + r.text.count("<entry")
            return True, f"feed ok, ~{items} items"
        return False, "no rss/atom markers"
    return _check


# ─────────────────────────────────────────────────────────────────────
# THE CHECKS
# ─────────────────────────────────────────────────────────────────────

def check_hn_topstories() -> CheckResult:
    url = "https://hacker-news.firebaseio.com/v0/topstories.json"
    ok, status, latency, sample, note = _probe(url, _expect_json_list(min_len=100))
    return CheckResult(
        name="Hacker News (Firebase) — topstories",
        tier="S", category="Tech chatter / pain language",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_hn_algolia_search() -> CheckResult:
    # Time-bounded query — the engine for Rumblings detection
    cutoff = int(time.time()) - (30 * 24 * 3600)  # last 30 days
    url = (
        "https://hn.algolia.com/api/v1/search_by_date"
        f"?query=pricing&tags=story&numericFilters=created_at_i>{cutoff}&hitsPerPage=5"
    )
    ok, status, latency, sample, note = _probe(url, _expect_json_keys("hits", "nbHits"))
    return CheckResult(
        name="Hacker News (Algolia) — time-bounded search",
        tier="S", category="Trajectory of pain terms",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_sec_edgar(cik_padded: str = "0000320193", name: str = "Apple") -> CheckResult:
    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    ok, status, latency, sample, note = _probe(
        url, _expect_json_keys("cik", "name", "filings"), headers=headers
    )
    return CheckResult(
        name=f"SEC EDGAR — submissions ({name})",
        tier="S", category="Public competitor filings",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_greenhouse_board(slug: str = "anthropic") -> CheckResult:
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    ok, status, latency, sample, note = _probe(url, _expect_json_keys("jobs", "meta"))
    return CheckResult(
        name=f"Greenhouse Boards — {slug}",
        tier="S", category="Hiring signal (primary)",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_lever(slug: str = "netflix") -> CheckResult:
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    ok, status, latency, sample, note = _probe(url, _expect_json_list(min_len=0))
    return CheckResult(
        name=f"Lever Postings — {slug}",
        tier="S", category="Hiring signal (secondary)",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
        critical=False,  # not every company uses Lever; OK if board is empty
    )


def check_ashby(slug: str = "ashbyhq") -> CheckResult:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true"
    ok, status, latency, sample, note = _probe(url, _expect_json_keys("jobs"))
    return CheckResult(
        name=f"Ashby Job Board — {slug}",
        tier="S", category="Hiring signal (modern startups)",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
        critical=False,
    )


def check_github_releases(repo: str = "anthropics/anthropic-sdk-python") -> CheckResult:
    url = f"https://api.github.com/repos/{repo}/releases"
    headers = {"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"}
    ok, status, latency, sample, note = _probe(
        url, _expect_json_list(min_len=0), headers=headers
    )
    if status == 403:
        note = "rate-limited (60/hr unauth) — set GITHUB_TOKEN for 5000/hr"
    return CheckResult(
        name=f"GitHub Releases — {repo}",
        tier="S", category="Product velocity / OSS momentum",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_wayback_available(url_to_check: str = "https://stripe.com/pricing") -> CheckResult:
    url = f"https://archive.org/wayback/available?url={url_to_check}"
    ok, status, latency, sample, note = _probe(url, _expect_json_keys("archived_snapshots"))
    return CheckResult(
        name="Wayback Machine — snapshot lookup",
        tier="S", category="Pricing/page diff (no infra)",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_producthunt_rss() -> CheckResult:
    url = "https://www.producthunt.com/feed"
    ok, status, latency, sample, note = _probe(url, _expect_xml_or_atom(),
                                               headers={"User-Agent": USER_AGENT})
    return CheckResult(
        name="ProductHunt — RSS",
        tier="A", category="New product launches",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_substack_rss(publication: str = "lenny") -> CheckResult:
    url = f"https://{publication}.substack.com/feed"
    ok, status, latency, sample, note = _probe(url, _expect_xml_or_atom(),
                                               headers={"User-Agent": USER_AGENT})
    return CheckResult(
        name=f"Substack — {publication}.substack.com",
        tier="A", category="Operator/founder content",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
    )


def check_hn_rss() -> CheckResult:
    url = "https://hnrss.org/frontpage"
    ok, status, latency, sample, note = _probe(url, _expect_xml_or_atom(),
                                               headers={"User-Agent": USER_AGENT})
    return CheckResult(
        name="HN Front Page — RSS",
        tier="A", category="Tech chatter (lightweight)",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
        critical=False,  # HN Firebase covers this; RSS is convenience
    )


def check_github_releases_atom(repo: str = "anthropics/anthropic-sdk-python") -> CheckResult:
    url = f"https://github.com/{repo}/releases.atom"
    ok, status, latency, sample, note = _probe(url, _expect_xml_or_atom(),
                                               headers={"User-Agent": USER_AGENT})
    return CheckResult(
        name=f"GitHub Releases (Atom) — {repo}",
        tier="A", category="Competitor product velocity",
        url=url, ok=ok, status_code=status, latency_ms=latency, sample=sample, note=note,
        critical=False,
    )


# ─────────────────────────────────────────────────────────────────────
# RUNNER
# ─────────────────────────────────────────────────────────────────────

ALL_CHECKS: list[tuple[str, Callable[[], CheckResult]]] = [
    ("hn_topstories",       check_hn_topstories),
    ("hn_algolia",          check_hn_algolia_search),
    ("sec_edgar",           check_sec_edgar),
    ("greenhouse",          check_greenhouse_board),
    ("lever",               check_lever),
    ("ashby",               check_ashby),
    ("github_releases",     check_github_releases),
    ("wayback",             check_wayback_available),
    ("producthunt_rss",     check_producthunt_rss),
    ("substack_rss",        check_substack_rss),
    ("hn_rss",              check_hn_rss),
    ("github_atom",         check_github_releases_atom),
]

QUICK_CHECKS = {"hn_topstories", "sec_edgar", "greenhouse", "wayback"}


def run_all(quick: bool = False) -> list[CheckResult]:
    results = []
    for key, fn in ALL_CHECKS:
        if quick and key not in QUICK_CHECKS:
            continue
        results.append(fn())
    return results


# ─────────────────────────────────────────────────────────────────────
# OUTPUT
# ─────────────────────────────────────────────────────────────────────

# ANSI colors (degrade gracefully on plain terminals)
class C:
    DIM = "\033[2m"
    BOLD = "\033[1m"
    GREEN = "\033[32m"
    RED = "\033[31m"
    YELLOW = "\033[33m"
    GOLD = "\033[38;5;179m"
    GREY = "\033[38;5;244m"
    RESET = "\033[0m"


def render_human(results: list[CheckResult]) -> str:
    lines = []
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines.append("")
    lines.append(f"{C.BOLD}{C.GOLD}SIGNAL CONSOLE · SOURCE VERIFIER{C.RESET}")
    lines.append(f"{C.GREY}run at {ts}{C.RESET}")
    lines.append("")

    by_tier: dict[str, list[CheckResult]] = {}
    for r in results:
        by_tier.setdefault(r.tier, []).append(r)

    for tier in ["S", "A", "B"]:
        if tier not in by_tier:
            continue
        lines.append(f"{C.BOLD}─── TIER {tier} ───{C.RESET}")
        for r in by_tier[tier]:
            icon = f"{C.GREEN}✓{C.RESET}" if r.ok else f"{C.RED}✗{C.RESET}"
            status = ""
            if r.status_code is not None:
                status = f" {C.DIM}[{r.status_code}{(' · ' + str(r.latency_ms) + 'ms') if r.latency_ms else ''}]{C.RESET}"
            crit = "" if r.critical else f" {C.GREY}(non-critical){C.RESET}"
            lines.append(f"  {icon} {r.name}{status}{crit}")
            lines.append(f"     {C.GREY}{r.category}{C.RESET}")
            lines.append(f"     {C.DIM}{r.url}{C.RESET}")
            if r.note:
                lines.append(f"     {C.YELLOW}note: {r.note}{C.RESET}")
            elif r.ok and r.sample:
                trimmed = r.sample if len(r.sample) <= 110 else r.sample[:107] + "..."
                lines.append(f"     {C.DIM}sample: {trimmed}{C.RESET}")
            lines.append("")

    total = len(results)
    okct = sum(1 for r in results if r.ok)
    critical_fail = sum(1 for r in results if not r.ok and r.critical)

    summary_color = C.GREEN if critical_fail == 0 else C.RED
    lines.append(f"{C.BOLD}{summary_color}{okct}/{total} sources live"
                 f"{(' · ' + str(critical_fail) + ' critical failure(s)') if critical_fail else ''}"
                 f"{C.RESET}")
    lines.append("")
    return "\n".join(lines)


def render_json(results: list[CheckResult]) -> str:
    return json.dumps(
        {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "results": [
                {
                    "name": r.name,
                    "tier": r.tier,
                    "category": r.category,
                    "url": r.url,
                    "ok": r.ok,
                    "status_code": r.status_code,
                    "latency_ms": r.latency_ms,
                    "sample": r.sample,
                    "note": r.note,
                    "critical": r.critical,
                }
                for r in results
            ],
        },
        indent=2,
    )


# ─────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Verify Signal Console data sources.")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument("--quick", action="store_true", help="run only Tier S critical checks")
    args = parser.parse_args()

    try:
        results = run_all(quick=args.quick)
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        sys.exit(2)

    out = render_json(results) if args.json else render_human(results)
    print(out)

    critical_fail = sum(1 for r in results if not r.ok and r.critical)
    sys.exit(1 if critical_fail else 0)


if __name__ == "__main__":
    main()
