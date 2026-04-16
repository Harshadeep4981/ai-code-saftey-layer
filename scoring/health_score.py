
from collections import Counter

# OUR SCORING SYSTEM DEPENDS ON MAINLY 3 FACTORS SO THAT WE DON'T BLINDLY GIVE SCORE
def calculate_health_score(issues, total_files):
    total_risk = 0
    high_issues = 0

    file_issue_count = Counter()

    for issue in issues:
        severity = issue["severity"]
        file_path = issue["file"]

        file_issue_count[file_path] += 1

        if severity == "low":
            total_risk += 1

        elif severity == "medium":
            total_risk += 3

        elif severity == "high":
            total_risk += 7
            high_issues += 1

    if total_files == 0:
        return 10.0

    if len(issues) == 0:
        return 10.0

    # Risk burden (WEIGHTED ISSUE LOAD PER FILE!)
    risk_burden = total_risk / total_files

    burden_score = risk_burden / (risk_burden + 1)

    # Concentration (ONE FILE HAS MORE ISSUES OR SPREADED?)
    max_file_issues = max(file_issue_count.values())

    concentration = max_file_issues / len(issues)

    # Security ratio
    security_ratio = high_issues / len(issues)

    # Combined risk index
    risk_index = burden_score + (0.3 * concentration) + (0.4 * security_ratio)

    if risk_index > 1:
        risk_index = 1

    score = 10 * (1 - risk_index)

    return round(score, 1)