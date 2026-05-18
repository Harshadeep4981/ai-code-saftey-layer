from collections import Counter
from scoring.health_score import calculate_health_score


def generate_summary(issues, total_files):

    severity_count = Counter()

    file_issue_count = Counter()

    for issue in issues:

        severity_count[issue["severity"]] += 1

        file_issue_count[issue["file"]] += 1

    score = calculate_health_score(issues, total_files)

    if score >= 9:
        status = "Excellent"

    elif score >= 7:
        status = "Good"

    elif score >= 5:
        status = "Moderate"

    elif score >= 3:
        status = "Poor"

    else:
        status = "Critical"

    summary = {

        "files_scanned": total_files,

        "total_issues": len(issues),

        "low_severity": severity_count["low"],

        "medium_severity": severity_count["medium"],

        "high_severity": severity_count["high"],

        "score": score,

        "status": status
    }

    return summary