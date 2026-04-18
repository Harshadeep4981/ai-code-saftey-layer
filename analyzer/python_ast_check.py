import ast
class UndefinedVariableVisitor(ast.NodeVisitor):
    def __init__(self, file_path, issues):
        self.defined_variables = set()
        self.file_path = file_path
        self.issues = issues

    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.defined_variables.add(target.id)

        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            if node.id not in self.defined_variables:
                if node.id not in dir(__builtins__):
                    self.issues.append({
                        "file": self.file_path,
                        "line": node.lineno,
                        "issue": "Possible undefined variable",
                        "details": f"'{node.id}' used before assignment",
                        "severity": "high"
                    })

        self.generic_visit(node)

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