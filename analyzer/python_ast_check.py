import ast
import builtins
import re

#  Precompute builtins
BUILTINS = set(dir(builtins))

#  Regex patterns for risky usage
RISKY_PATTERNS = [
    (re.compile(r"\beval\s*\("), "Use of eval() can be dangerous"),
    (re.compile(r"\bexec\s*\("), "Use of exec() can be dangerous"),
]


class UndefinedVariableVisitor(ast.NodeVisitor):
    def __init__(self, file_path, issues):
        self.defined_variables = set()
        self.used_variables = set()
        self.file_path = file_path
        self.issues = issues

    #  Handles assignment
    def visit_Assign(self, node):
        self.generic_visit(node)
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.defined_variables.add(target.id)

    #  Handles for loops
    def visit_For(self, node):
        if isinstance(node.target, ast.Name):
            self.defined_variables.add(node.target.id)
        self.generic_visit(node)

    #  Handles function definitions
    def visit_FunctionDef(self, node):
        for arg in node.args.args:
            self.defined_variables.add(arg.arg)
        self.generic_visit(node)

    #  Handles variable usage
    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):

            if node.id in BUILTINS:
                return

            if node.id not in self.defined_variables:
                self.issues.append({
                    "file": self.file_path,
                    "line": node.lineno,
                    "issue": "Possible undefined variable",
                    "details": f"'{node.id}' used before assignment",
                    "severity": "high"
                })

            self.used_variables.add(node.id)

        self.generic_visit(node)


def check_python_syntax(file_data, file_path, issues):
    try:
        #  AST parsing
        tree = ast.parse(file_data)

        #  AST visitor
        visitor = UndefinedVariableVisitor(file_path, issues)
        visitor.visit(tree)

        #  Unused variables
        unused_vars = visitor.defined_variables - visitor.used_variables

        for var in unused_vars:
            if var.lower() in ["password", "token", "api_key"]:
                continue

            issues.append({
                "file": file_path,
                "line": None,
                "issue": "Unused variable",
                "details": f"'{var}' is defined but never used",
                "severity": "low"
            })

        # Regex-based risky pattern detection
        lines = file_data.splitlines()

        for line_number, line in enumerate(lines, start=1):
            for pattern, message in RISKY_PATTERNS:
                if pattern.search(line):
                    issues.append({
                        "file": file_path,
                        "line": line_number,
                        "issue": "Risky code usage",
                        "details": message,
                        "severity": "high"
                    })

    except SyntaxError as error:
        issues.append({
            "file": file_path,
            "line": error.lineno,
            "issue": "Syntax Error",
            "details": error.msg,
            "severity": "high"
        })