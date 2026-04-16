import ast


def check_python_syntax(file_data, file_path, issues):
    try:
        ast.parse(file_data)

    except SyntaxError as error:
        issues.append({
            "file": file_path,
            "line": error.lineno,
            "issue": "Syntax Error",
            "details": error.msg,
            "severity": "high"
        })