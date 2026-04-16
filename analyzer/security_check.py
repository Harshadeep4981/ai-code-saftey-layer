def check_security(lines, file_path, issues):
    print("=== HARD CODED SECRET CHECK RUNNING ===")
    suspicious_keywords = [
        "password",
        "passwd",
        "token",
        "api_key",
        "apikey",
        "secret"
    ]

    for i, line in enumerate(lines, start=1):

        clean_line = line.strip().lower()
        print("SECRET CHECK LINE:", clean_line)
        keyword_found = False

        # Step 1: Check suspicious words
        for word in suspicious_keywords:
            if word in clean_line:
                print("KEYWORD FOUND:", word)
                keyword_found = True
                break

        # Step 2: Check assignment and quotes
        if keyword_found:

            has_equal_sign = False
            has_quotes = False

            if "=" in clean_line:
                has_equal_sign = True

            if '"' in clean_line:
                has_quotes = True

            if "'" in clean_line:
                has_quotes = True

            # Step 3: Add issue if suspicious
            if has_equal_sign and has_quotes:
                print("ADDING SECRET ISSUE:", clean_line)
                issues.append({
                    "file": file_path,
                    "line": i,
                    "issue": "Possible hardcoded secret detected",
                    "details": "Sensitive value written directly in code",
                    "severity": "high"
                })