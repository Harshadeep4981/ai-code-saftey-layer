import ast
import builtins

BUILTINS = set(dir(builtins)) | {"__file__", "__name__", "__doc__", "__package__"}

class DefinitionCollector(ast.NodeVisitor):

    def __init__(self):
        self.defined_variables = set()

    def visit_Import(self, node):
        for alias in node.names:
            self.defined_variables.add(alias.asname or alias.name)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.defined_variables.add(alias.asname or alias.name)

    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.defined_variables.add(target.id)
        self.generic_visit(node)

    def visit_For(self, node):
        if isinstance(node.target, ast.Name):
            self.defined_variables.add(node.target.id)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self.defined_variables.add(node.name)
        for arg in node.args.args:
            self.defined_variables.add(arg.arg)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        self.defined_variables.add(node.name)
        self.generic_visit(node)

    # ADDED: This makes the scanner understand 'with open(...) as f:'
    def visit_With(self, node):
        for item in node.items:
            if isinstance(item.optional_vars, ast.Name):
                self.defined_variables.add(item.optional_vars.id)
        self.generic_visit(node)

    # ADDED: This makes the scanner understand 'except Exception as e:'
    def visit_ExceptHandler(self, node):
        if node.name:
            self.defined_variables.add(node.name)
        self.generic_visit(node)

class UndefinedVariableVisitor(ast.NodeVisitor):

    def __init__(self, file_path, issues, defined_variables):
        self.file_path = file_path
        self.issues = issues
        self.defined_variables = defined_variables
        self.used_variables = set()

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            if node.id in BUILTINS:
                self.used_variables.add(node.id)
                return
            if node.id not in self.defined_variables:
                self.issues.append({
                    "file": self.file_path,
                    "line": node.lineno,
                    "issue": "Undefined variable",
                    "details": f"'{node.id}' used before assignment",
                    "severity": "high"
                })
            self.used_variables.add(node.id)
        self.generic_visit(node)


def check_python_syntax(file_data, file_path, issues):
    try:
        tree = ast.parse(file_data)
        collector = DefinitionCollector()
        collector.visit(tree)

        visitor = UndefinedVariableVisitor(
            file_path,
            issues,
            collector.defined_variables
        )
        visitor.visit(tree)

        unused_vars = collector.defined_variables - visitor.used_variables
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

    except SyntaxError as error:
        issues.append({
            "file": file_path,
            "line": error.lineno,
            "issue": "Syntax Error",
            "details": error.msg,
            "severity": "high"
        })