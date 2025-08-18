import jedi
import json
import sys

while True:
    try:
        line = sys.stdin.readline()
        if not line:
            break

        request = json.loads(line)
        source = request['source']
        path = request['path']
        line = request['line']
        column = request['column']

        script = jedi.Script(source, path=path)
        inference = script.infer(line, column)

        if inference:
            result = {
                'name': inference[0].name,
                'full_name': inference[0].full_name,
                'type': inference[0].type,
                'docstring': inference[0].docstring(),
                'module_name': inference[0].module_name
            }
        else:
            result = None

        sys.stdout.write(json.dumps(result) + '\n')
        sys.stdout.flush()
    except Exception as e:
        sys.stdout.write(json.dumps({'error': str(e)}) + '\n')
        sys.stdout.flush()
