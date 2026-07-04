import re
def validate_ai_output(code):

    errors = []

    suspicious_patterns = [

        "rest of the code remains the same",

        "functionality preserved",

        "security issue fixed",

        "vulnerability fixed",

        "here is the corrected code",

        "the code has been corrected",

        "the vulnerability has been fixed",

        "the issue has been fixed",

        "this code fixes",

        "corrected version"

    ]

    for pattern in suspicious_patterns:

        if pattern.lower() in code.lower():

            errors.append(
                "AI returned explanation instead of code"
            )

            break

    # AI returned markdown

    if "```" in code:

        errors.append(
            "AI returned markdown"
        )

    # Empty response

    if len(code.strip()) == 0:

        errors.append(
            "AI returned empty response"
        )
    for line in code.splitlines():

        line = line.strip()

        if line.startswith("#"):

            if not line.startswith("# FIXED:"):

                errors.append(
                    "Invalid explanation comment"
                )

                break

    return errors