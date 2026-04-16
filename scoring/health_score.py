
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

    # Risk burden (WEIGHTED ISSUE LOAD PER FILE!) Baseline risk
    risk_burden = total_risk / total_files

    burden_score = risk_burden / (risk_burden + 1)

    # Concentration (ONE FILE HAS MORE ISSUES OR SPREADED?) amplifies burden
    max_file_issues = max(file_issue_count.values())

    concentration = max_file_issues / len(issues)

    # Security ratio amplifies risk
    security_ratio = high_issues / len(issues)

    # Combined risk index
    amplification_factor = 1 + concentration*security_ratio
    risk_index = burden_score*amplification_factor

    if risk_index > 1:
        risk_index = 1

    score = 10 * (1 - risk_index)

    return round(score, 1)