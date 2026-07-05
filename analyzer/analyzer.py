import re
import ast

from analyzer.Quality_check.many_imports import check_imports
from analyzer.Quality_check.nested_loop import check_nested_loop
from analyzer.Security_check.security_check import check_security
from analyzer.Semantic_check.python_ast_check import check_python_syntax
from analyzer.Semantic_check.unreachable_code import check_unreachable_code
from analyzer.Security_check.dangerous_functions import check_dangerous_functions
from analyzer.Security_check.command_injection import check_command_injection

def safe_execute(func, *args):
    """Executes a check. If a scanner module crashes, it logs to the server but DOES NOT flag a fake bug for the user."""
    try:
        func(*args)
    except Exception as e:
        # Silently print to backend console. Do not pollute the user's dashboard!
        print(f"⚠️ Internal Scanner Warning in {func.__name__}: {str(e)}")

def heuristic_fallback(lines, file_path, issues):
    """Stricter Regex: Only runs if AST fails, and only flags DYNAMIC/untrusted inputs."""
    clean_lines = [line for line in lines if not line.strip().startswith('#')]
    
    # We look for dangerous functions that use dynamic formatting (f-strings, +, %)
    # This ignores safe, hardcoded strings like os.system("clear") or open("data.txt")
    patterns = {
        "Critical OS Command Injection": r"os\.(popen|system|exec|spawn)\s*\(\s*(f['\"]|.*[+%])",
        "Potential XSS": r"render_template_string\s*\(\s*(f['\"]|.*[+%])"
    }
    
    code_text = "\n".join(clean_lines)
    if "import pathlib" not in code_text and "from pathlib" not in code_text:
        # Only flag open() if it's dynamically concatenating paths
        patterns["Path Traversal Risk"] = r"open\s*\(\s*(f['\"]|.*[+%])"
    
    for title, pattern in patterns.items():
        for i, line in enumerate(clean_lines):
            if re.search(pattern, line):
                issues.append({
                    "file": file_path, 
                    "line": i + 1,  # Point to the actual line number
                    "issue": title, 
                    "details": "Detected risky dynamic variable input in sensitive function.", 
                    "severity": "high"
                })

def analyze_file(lines, file_path, issues):
    file_data = "\n".join(lines)
    
    # 1. RUN GENERAL CHECKS (Hardcoded secrets, imports, etc.)
    safe_execute(check_imports, lines, file_path, issues)
    safe_execute(check_nested_loop, lines, file_path, issues)
    safe_execute(check_security, lines, file_path, issues)

    # 2. SMART AST ROUTING
    if file_path.endswith('.py'):
        # Check if the code has valid syntax before building the AST
        try:
            ast.parse(file_data)
            is_valid_syntax = True
        except SyntaxError:
            is_valid_syntax = False

        if is_valid_syntax:
            # If the code is valid, TRUST THE AST! (It won't generate false positives)
            safe_execute(check_python_syntax, file_data, file_path, issues)
            safe_execute(check_unreachable_code, file_data, file_path, issues)
            safe_execute(check_dangerous_functions, file_data, file_path, issues)
            safe_execute(check_command_injection, file_data, file_path, issues)
        else:
            # If the code has broken syntax, the AST will fail. Fall back to Regex.
            heuristic_fallback(lines, file_path, issues)
    else:
     
        heuristic_fallback(lines, file_path, issues)