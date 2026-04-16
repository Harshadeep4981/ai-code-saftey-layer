from analyzer.long_line import check_long_lines
from analyzer.many_imports import check_imports
from analyzer.nested_loop import check_nested_loop
from analyzer.security_check import check_security
from analyzer.python_ast_check import check_python_syntax

def analyze_file(lines, file_path, issues):

    #RULE - 1:

    check_long_lines(lines, file_path, issues)

    #RULE - 2:

    check_imports(lines, file_path, issues)

    #RULE - 3:
    
    check_nested_loop(lines, file_path, issues)
    
    #RULE - 4 (HARDCODED SECRETS)

    check_security(lines,file_path,issues)

    #NOW WE HAVE MOVED TO DETECTION OF SYNTAX ERRORS
    if file_path.endswith('.py'):
        file_path = "\n".join(lines)
        check_python_syntax(lines,file_path,issues)