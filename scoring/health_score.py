def calculate_health_score(issues):

    score = 10.0

    for issue in issues:

        severity = issue["severity"]

        #Severity score
        if severity == "high":
            score -= 1.5

        elif severity == "medium":
            score -= 0.75
            
        elif severity == "low":
            score -= 0.25

        # Extra Penalties
        issue_name = issue["issue"].lower()

        if "hardcoded secret" in issue_name:
            score -= 1

        elif "syntax error" in issue_name:
            score -= 1

        elif "eval" in issue_name or "exec" in issue_name:
            score -= 1.5

    #Limit the score
    score = max(0, min(10, score))

    return round(score, 1)