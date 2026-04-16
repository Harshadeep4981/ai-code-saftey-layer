def check_nested_loop(lines,file_path,issues):
    for i in range(len(lines)-1):
        line1 = lines[i].strip()
        line2 = lines[i+1].strip()
        if line1.startswith("for") and line2.startswith("for"):
            issues.append({
                "file": file_path,
                "line": i + 1,
                "issue": "Nested loop detected",
                "details": "Potential performance issue",
                "severity": "medium"
                                    })