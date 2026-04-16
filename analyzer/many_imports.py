def check_imports(lines, file_path, issues):
    import_count = 0

    for line in lines:
        clean_line = line.strip()

        if clean_line.startswith("import") or clean_line.startswith("from"):
            import_count += 1

    if import_count > 3:
        issues.append({
            "file": file_path,
            "line": None,
            "issue": "Too many imports",
            "details": f"{import_count} imports",
            "severity": "medium"
        })