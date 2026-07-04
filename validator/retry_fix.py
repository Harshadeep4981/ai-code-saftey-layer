from validator.validator import validate_ai_output

from analyzer.analyzer import analyze_file

from ai.generate_secure_code import generate_secure_code


def generate_validated_secure_code(
        code,
        issues):

    max_attempts = 3

    current_code = code

    for attempt in range(max_attempts):

        print(
            f"\nAttempt {attempt + 1}"
        )

        if attempt == 0:

            issues_to_fix = issues.copy()

        else:

            issues_to_fix = important_issues.copy()

        fixed_code = generate_secure_code(
            current_code,
            issues_to_fix
        )

        ai_errors = validate_ai_output(
            fixed_code
        )

        if ai_errors:

            print(
                "AI Output Errors:",
                ai_errors
            )

            current_code = fixed_code

            continue

        remaining_issues = []

        analyze_file(
            fixed_code.splitlines(),
            "fixed_code.py",
            remaining_issues
        )

        important_issues = []

        for issue in remaining_issues:

            severity = issue.get(
                "severity",
                ""
            ).lower()

            if severity in [
                "high",
                "medium"
            ]:

                important_issues.append(
                    issue
                )

        if len(important_issues) == 0:

            print(
                "Validation Passed"
            )

            return fixed_code

        print(
            "Important Issues:",
            important_issues
        )

        current_code = fixed_code

    return fixed_code