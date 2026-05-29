#!/usr/bin/env python3
"""
format-briefing-verification.py — turn a briefing-pipeline POST response
into a markdown log entry the verify workflow appends to
deliverables/audit/briefing-verification-log.md.

Defensive: any parse error renders a "could not parse" entry rather than
exiting non-zero. The log is the audit trail; missing one entry would
be worse than a noisy one.

Usage:
    python3 format-briefing-verification.py <response.json> <sha> <commit_message>

Stdout is the markdown block to append.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone


def _first_line(text: str) -> str:
    """Pull the first non-blank line from a (possibly multi-line) commit message."""
    if not text:
        return "(no commit message)"
    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return "(no commit message)"


def _stage_line(stage: dict) -> str:
    name = stage.get("stage", "?")
    outcome = stage.get("outcome", "?")
    notes = stage.get("notes", "")
    # Truncate notes so the log stays scannable. Full payload lives in
    # the workflow run logs if anyone needs to dig.
    if len(notes) > 140:
        notes = notes[:137] + "..."
    return f"- `{name}`: **{outcome}** — {notes}"


def _format_entry(response_text: str, sha: str, commit_message: str) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    header = (
        f"\n---\n\n"
        f"### {now} · `{sha[:7]}`\n\n"
        f"> {_first_line(commit_message)}\n\n"
    )

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError as exc:
        body = (
            f"**Could not parse response as JSON** ({exc}).\n\n"
            f"```\n{response_text[:600]}\n```\n"
        )
        return header + body

    if isinstance(data, dict) and data.get("transport_error"):
        return header + f"**Transport error:** `{data['transport_error']}`\n"

    if not isinstance(data, dict):
        return header + f"**Unexpected response shape:** `{type(data).__name__}`\n"

    ok = data.get("ok", False)
    duration = data.get("durationMs", 0)
    workspaces = data.get("workspaces", 0)
    totals = data.get("totals", {}) if isinstance(data.get("totals"), dict) else {}

    summary_lines = [
        f"**ok:** {ok} · **duration:** {duration} ms · **workspaces:** {workspaces}",
        "",
    ]

    if totals:
        cost_synth = totals.get("synth_cost_usd", 0)
        cost_enrich = totals.get("enrich_cost_usd", 0)
        cost_contrarian = totals.get("contrarian_cost_usd", 0)
        cost_compose = totals.get("compose_cost_usd", 0)
        total_cost = float(cost_synth) + float(cost_enrich) + float(cost_contrarian) + float(cost_compose)
        summary_lines.extend(
            [
                f"- Patterns synthesized: **{totals.get('patterns_synthesized', 0)}** "
                f"(gated out: {totals.get('patterns_gated_out', 0)})",
                f"- Clusters: {totals.get('clusters_considered', 0)} considered → "
                f"{totals.get('clusters_qualified', 0)} qualified → "
                f"{totals.get('clusters_persisted', 0)} persisted",
                f"- Enriched: {totals.get('enriched', 0)} / {totals.get('kept', 0)} kept "
                f"({totals.get('enrich_noise', 0)} noise, {totals.get('enrich_errored', 0)} errored)",
                f"- Fetched: {totals.get('fetched', 0)} items from "
                f"{data.get('sources', 0)} sources ({totals.get('inserted', 0)} new, "
                f"{totals.get('deduped', 0)} deduped)",
                f"- Triggers: {totals.get('triggers_evaluated', 0)} evaluated, "
                f"{totals.get('triggers_fired', 0)} fired",
                f"- Periphery: {totals.get('periphery_candidates_persisted', 0)} candidates persisted "
                f"(watched: {totals.get('periphery_watched_count', 0)})",
                f"- Contrarian: {totals.get('contrarian_outcome', 'n/a')}",
                f"- Compose: {totals.get('compose_outcome', 'n/a')}",
                f"- **Run cost: ${total_cost:.4f}**",
                "",
            ]
        )

    per_workspace = data.get("perWorkspace", [])
    if per_workspace and isinstance(per_workspace, list):
        ws = per_workspace[0]
        status = ws.get("status", "?")
        run_id = ws.get("runId", "?")
        summary_lines.append(f"**Workspace 1 status:** `{status}` · run `{run_id[:8]}`")
        summary_lines.append("")

        stages = ws.get("stages", []) if isinstance(ws.get("stages"), list) else []
        if stages:
            summary_lines.append("**Stages:**")
            summary_lines.append("")
            for stage in stages:
                if isinstance(stage, dict):
                    summary_lines.append(_stage_line(stage))
            summary_lines.append("")

        # Surface aborted-reason if present
        ws_data = ws.get("data", {}) if isinstance(ws.get("data"), dict) else {}
        aborted_reason = ws_data.get("aborted_reason")
        if aborted_reason:
            summary_lines.append(f"**Aborted reason:** `{aborted_reason}`")
            summary_lines.append("")

        # Surface stage-level data.cost_summary if present (the cost_check stage)
        for stage in stages:
            if isinstance(stage, dict) and stage.get("stage") == "cost_check":
                cost_data = stage.get("data", {})
                if isinstance(cost_data, dict):
                    summary = cost_data.get("cost_summary", {})
                    if isinstance(summary, dict):
                        weekly = summary.get("weekly_cost_usd", 0)
                        ceiling = summary.get("ceiling_usd", 0)
                        state = summary.get("state", "?")
                        fraction = summary.get("fraction_of_ceiling", 0)
                        summary_lines.append(
                            f"**Cost gate at start:** ${float(weekly):.4f} / ${float(ceiling):.2f} "
                            f"({float(fraction) * 100:.0f}%) — state: `{state}`"
                        )
                        summary_lines.append("")

    return header + "\n".join(summary_lines).rstrip() + "\n"


def main() -> int:
    if len(sys.argv) < 4:
        sys.stderr.write(
            "usage: format-briefing-verification.py <response.json> <sha> <commit_message>\n"
        )
        return 2
    response_path = sys.argv[1]
    sha = sys.argv[2]
    commit_message = sys.argv[3]
    try:
        with open(response_path, "r", encoding="utf-8") as f:
            response_text = f.read()
    except OSError as exc:
        sys.stderr.write(f"could not read response file: {exc}\n")
        response_text = ""

    print(_format_entry(response_text, sha, commit_message), end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
