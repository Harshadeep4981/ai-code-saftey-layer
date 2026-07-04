def check_security(lines, file_path, issues):

    suspicious_keywords = [

        "password",
        "passwd",
        "token",
        "api_key",
        "apikey",
        "secret"

    ]

    safe_patterns = [

        "os.getenv(",
        "os.environ[",
        "os.environ.get(",
        "getpass.getpass("
    ]

    for i, line in enumerate(
        lines,
        start=1
    ):

        clean_line = line.strip().lower()

        keyword_found = False

        for word in suspicious_keywords:

            if word in clean_line:

                keyword_found = True

                break

        if not keyword_found:
            continue

        # Ignore environment-variable usage

        safe = False

        for pattern in safe_patterns:

            if pattern.lower() in clean_line:

                safe = True

                break
        if "enter password" in clean_line:
         
            safe = True

        if safe:
            continue

        has_equal_sign = "=" in clean_line

        has_quotes = (
            '"' in clean_line
            or "'" in clean_line
        )

        if has_equal_sign and has_quotes:

            issues.append({

                "file": file_path,

                "line": i,

                "issue":
                "hardcoded secret detected",

                "details":
                "Sensitive value written directly in code",

                "severity":
                "high"

            })