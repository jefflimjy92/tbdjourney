from pathlib import Path
import re


SRC_ROOT = Path("src")
SHIM_PATH = Path("src/app/vendor/lucide-react.ts")
EXTENSIONS = {".ts", ".tsx"}
SKIP_PARTS = {"mockData/generated", "app/vendor"}


def collect_used_icons() -> set[str]:
    used: set[str] = set()
    pattern = re.compile(r'import\s*\{([^}]+)\}\s*from\s*[\'"]lucide-react[\'"]')
    alias_pattern = re.compile(r"\s+as\s+")

    for path in SRC_ROOT.rglob("*"):
        if path.suffix not in EXTENSIONS:
            continue
        normalized = path.as_posix()
        if any(skip in normalized for skip in SKIP_PARTS):
            continue
        text = path.read_text()
        for match in pattern.finditer(text):
            for part in match.group(1).split(","):
                raw = part.strip()
                if not raw:
                    continue
                imported = alias_pattern.split(raw)[0].strip()
                if imported:
                    used.add(imported)

    return used


def build_icon_map() -> dict[str, str]:
    icon_map: dict[str, str] = {}

    direct_export = re.compile(r"^export \{ default as ([^,}]+) \} from '\./(.+)\.js';$")
    alias_export = re.compile(r"^export \{ (.+) \} from '\./icons/(.+)\.js';$")
    alias_name = re.compile(r"^default as (.+)$")

    source_files = [
        Path("node_modules/lucide-react/dist/esm/icons/index.js"),
        Path("node_modules/lucide-react/dist/esm/lucide-react.js"),
    ]

    for file in source_files:
        for line in file.read_text().splitlines():
            match = direct_export.match(line)
            if match:
                icon_map[match.group(1)] = match.group(2)
                continue

            match = alias_export.match(line)
            if not match:
                continue

            export_path = match.group(2)
            for part in match.group(1).split(","):
                alias_match = alias_name.match(part.strip())
                if alias_match:
                    icon_map[alias_match.group(1)] = export_path

    return icon_map


def main() -> None:
    used = sorted(collect_used_icons())
    icon_map = build_icon_map()
    missing = [name for name in used if name not in icon_map]
    if missing:
        raise SystemExit(f"Missing lucide mappings: {missing}")

    lines = [
        "// Auto-generated local shim for lucide-react build performance",
        "// Exports only icons actually used in this repo.",
    ]
    lines.extend(
        f"export {{ default as {name} }} from 'lucide-react/dist/esm/icons/{icon_map[name]}.js';"
        for name in used
    )
    lines.append("")

    SHIM_PATH.parent.mkdir(parents=True, exist_ok=True)
    SHIM_PATH.write_text("\n".join(lines))
    print(f"wrote {SHIM_PATH} ({len(used)} icons)")


if __name__ == "__main__":
    main()
