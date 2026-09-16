"""Pull every capitalised word out of the prose that would actually be read.

Base64 payloads, style and script bodies, comments, tags and entities are not
prose and spell words by accident, so they come out first.
"""
import pathlib
import re


def words(dist: pathlib.Path) -> set[str]:
    text = "\n".join(p.read_text(errors="ignore") for p in sorted(dist.rglob("*.html")))
    prose = re.sub(r"data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+", " ", text)
    prose = re.sub(r"<style.*?</style>|<script.*?</script>|<!--.*?-->", " ", prose, flags=re.S)
    prose = re.sub(r"<[^>]+>", " ", prose)
    prose = re.sub(r"&[a-z]+;|&#\d+;", " ", prose)
    return set(re.findall(r"\b[A-Z][a-zA-Z]{2,}\b", prose))
