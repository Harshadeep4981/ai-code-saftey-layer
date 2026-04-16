from collections import Counter
from scoring.health_score import calculate_health_score

def generate_summary(issues, total_files):
    print("\n=== REPOSITORY SUMMARY ===")

    print(f"Files scanned: {total_files}")
    print(f"Total issues found: {len(issues)}")

    severity_count = Counter()
    file_issue_count = Counter()

    for issue in issues:
        severity_count[issue["severity"]] += 1
        file_issue_count[issue["file"]] += 1

    print(f"Low severity issues: {severity_count['low']}")
    print(f"Medium severity issues: {severity_count['medium']}")
    print(f"High severity issues: {severity_count['high']}")

    if file_issue_count:
        problematic_file = file_issue_count.most_common(1)[0]    #most_common(0) highest count and [0] for first element

        print(
            f"Most problematic file: "
            f"{problematic_file[0]} "
            f"({problematic_file[1]} issues)"
        )
    score = calculate_health_score(issues,total_files)
    print('=====REPOSITORY HEALTH SCORE=====')
    print(f'score:{score}/10')
    if score >= 9:
        print("Status: Excellent")

    elif score >= 7:
        print("Status: Good")

    elif score >= 5:
        print("Status: Moderate")

    elif score >= 3:
        print("Status: Poor")

    else:
        print("Status: Critical")