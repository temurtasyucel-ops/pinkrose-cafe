#!/usr/bin/env python3
"""Download every object from the private product-images Supabase Storage bucket."""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
destination = pathlib.Path(os.environ.get("STORAGE_BACKUP_DIR", "backup/product-images")).resolve()
if not base_url.startswith("https://") or not service_key:
    sys.exit("SUPABASE_URL must be HTTPS and SUPABASE_SERVICE_ROLE_KEY must be set.")

headers = {"Authorization": f"Bearer {service_key}", "apikey": service_key, "Content-Type": "application/json"}

def request(url, data=None):
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()

def list_objects(prefix):
    offset = 0
    while True:
        body = json.dumps({"prefix": prefix, "limit": 100, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}).encode()
        payload = json.loads(request(f"{base_url}/storage/v1/object/list/product-images", body))
        if not isinstance(payload, list):
            raise RuntimeError(f"Unexpected Storage listing for prefix {prefix!r}")
        yield from payload
        if len(payload) < 100:
            break
        offset += len(payload)

def walk(prefix=""):
    for entry in list_objects(prefix):
        name = entry.get("name")
        if not isinstance(name, str) or not name or name in {".", ".."} or "/" in name or "\\" in name:
            raise RuntimeError(f"Unsafe object name returned by Storage: {name!r}")
        path = f"{prefix}/{name}".strip("/")
        if entry.get("id") is None and entry.get("metadata") is None:
            yield from walk(path)
            continue
        rel = pathlib.PurePosixPath(path)
        if rel.is_absolute() or ".." in rel.parts:
            raise RuntimeError(f"Unsafe object path returned by Storage: {path!r}")
        target = (destination / pathlib.Path(*rel.parts)).resolve()
        if destination not in target.parents:
            raise RuntimeError(f"Storage path escaped backup directory: {path!r}")
        target.parent.mkdir(parents=True, exist_ok=True)
        url = f"{base_url}/storage/v1/object/authenticated/product-images/{urllib.parse.quote(path, safe='/')}"
        target.write_bytes(request(url))
        print(f"Backed up Storage object: {path}")

try:
    walk()
except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError, ValueError) as exc:
    sys.exit(f"Storage backup failed: {exc}")
print("Storage backup completed.")
