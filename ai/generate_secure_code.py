import re
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_secure_code(code, issues):
    prompt = f"""
    You are an automated code remediation tool and a Senior Python Security Engineer.
    You must output ONLY raw, valid Python code. Do not include any conversational text, explanations, or markdown formatting (do not use ```python). 
    Your entire response must be executable code.

    ORIGINAL CODE:
    {code}

    ISSUES TO FIX:
    {issues}
    
    IMPORTANT:
    Fix ONLY the issues listed above.
    Do not modify code that is not related to those issues.
    If an issue has already been fixed, do not modify that section again.
    Preserve all previously corrected code.

    TASK:
    Return a corrected and secure version of the ORIGINAL CODE.

    RULES:
    1. Return the COMPLETE source file.
    2. Preserve existing structure whenever possible.
    3. Modify only the lines required to fix vulnerabilities.
    4. Preserve functionality whenever safely possible.
    5. Remove hardcoded secrets.
    6. Replace eval().
    7. Replace exec().
    8. Replace os.system().
    9. Fix undefined variables when possible.
    10. Return valid Python code only.

    IMPORT RULES (CRITICAL):
    You MUST delete any `import` statements that are no longer used in your corrected code. Do not leave unused imports at the top of the file.

    STRICT SCOPE LIMITS:
    - DO NOT append new helper functions outside of the original code structure.
    - DO NOT add execution blocks (e.g., if __name__ == "__main__":).
    - DO NOT add testing code, input() prompts, or driver logic at the bottom of the file.

    FUNCTIONALITY PRESERVATION RULES:
    Never replace user input with hardcoded values.
    Never replace dynamic behavior with constants.
    Never remove existing functionality unless it is dangerous.
    Preserve original execution flow whenever safely possible.
    Do not simplify code by replacing variables with fixed values.

    When fixing os.system(command):
    GOOD:
    import subprocess
    subprocess.run(command.split(), shell=False)

    BAD:
    subprocess.run(command, shell=True)

    When fixing subprocess.run():
    ALWAYS use: shell=False
    NEVER use: shell=True

    When fixing eval(user_input):
    GOOD:
    import ast
    result = ast.literal_eval(user_input)

    BAD:
    result = 2 + 2

    When fixing exec(user_input):
    Remove exec completely.

    Do not introduce any of these dangerous functions:
    eval
    exec
    compile
    os.system

    COMMENT RULES (STRICTLY ENFORCED):
    1. You MUST add exactly one "# FIXED: <brief description>" comment strictly ABOVE every line or block of code you actively rewrite or secure.
    2. FATAL ERROR PREVENTION: If a block of code is identical to the ORIGINAL CODE (e.g., you chose not to fix a stylistic or low-risk issue to preserve functionality), it is a FATAL ERROR to place a comment above it. 
    3. If you do not change the syntax, you MUST remain 100% silent. Do not acknowledge ignored issues. Pretend they do not exist.
    4. The ONLY allowed comment string in this entire file is "# FIXED: " followed by 3-5 words.

    OUTPUT FORMAT:
    Return ONLY Python source code.
    Every line in the response must be either valid Python code or a comment starting with "# FIXED:".
    If you cannot confidently fix a line, leave it unchanged.
    Return only the corrected source file.
    """

    response = client.chat.completions.create(
        model="llama-3.3-8b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )

    result = response.choices[0].message.content

    # BULLETPROOF EXTRACTION: Look for markdown code block first
    pattern = "`" * 3 + r"(?:python)?(.*?)" + "`" * 3
    code_block_match = re.search(pattern, result, re.DOTALL | re.IGNORECASE)
    
    if code_block_match:
        raw_code = code_block_match.group(1).strip()
    else:
        raw_code = result.strip()

    # FILTERING: Clean up unwanted lines and chatty text
    cleaned_lines = []
    for line in raw_code.splitlines():
        stripped = line.strip()
        
        # If it is a comment, but NOT a "FIXED" comment, drop it.
        if stripped.startswith("#") and not stripped.startswith("# FIXED:"):
            continue
            
        cleaned_lines.append(line)

    final_code = "\n".join(cleaned_lines)
    return final_code.strip()