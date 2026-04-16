def check_long_lines(lines, file_path, issues):
    for i, line in enumerate(lines, start=1):
        if len(line) > 50:
            issues.append({
                "file": file_path,
                "line": i,
                "issue": "Line too long",
                "details": f"{len(line)} characters",
                "severity": "low"
            })