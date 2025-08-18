import { Info } from '../types';

export const MAP: Record<string, Info> = {
    class: { title: 'class — Class Definitions', url: 'reference/compound_stmts.html', anchor: 'class-definitions' },
    def: { title: 'def — Function Definitions', url: 'reference/compound_stmts.html', anchor: 'function-definitions' },
    return: { title: 'return — Return Statement', url: 'reference/simple_stmts.html', anchor: 'the-return-statement' },
    with: { title: 'with — Context Managers', url: 'reference/compound_stmts.html', anchor: 'the-with-statement' },
    yield: { title: 'yield — Yield Expressions', url: 'reference/expressions.html', anchor: 'yield-expressions' },
    async: { title: 'async — Asynchronous Functions', url: 'reference/compound_stmts.html', anchor: 'async-def' },
    await: { title: 'await — Await Expressions', url: 'reference/expressions.html', anchor: 'await-expression' },
    import: { title: 'import — Import Statements', url: 'reference/simple_stmts.html', anchor: 'the-import-statement' },
    from: { title: 'from — Import From Statement', url: 'reference/simple_stmts.html', anchor: 'the-import-statement' },
    try: { title: 'try — Exception Handling', url: 'reference/compound_stmts.html', anchor: 'the-try-statement' },
    if: { title: 'if — Conditional Statements', url: 'reference/compound_stmts.html', anchor: 'the-if-statement' },
    for: { title: 'for — For Loops', url: 'reference/compound_stmts.html', anchor: 'the-for-statement' },
    while: { title: 'while — While Loops', url: 'reference/compound_stmts.html', anchor: 'the-while-statement' },
    except: { title: 'except — Exception Handlers', url: 'reference/compound_stmts.html', anchor: 'the-try-statement' },
    finally: { title: 'finally — Cleanup Code', url: 'reference/compound_stmts.html', anchor: 'the-try-statement' },
    else: { title: 'else — Alternative Execution', url: 'reference/compound_stmts.html', anchor: 'the-if-statement' },
    elif: { title: 'elif — Else If', url: 'reference/compound_stmts.html', anchor: 'the-if-statement' },
    break: { title: 'break — Loop Termination', url: 'reference/simple_stmts.html', anchor: 'the-break-statement' },
    continue: { title: 'continue — Loop Continuation', url: 'reference/simple_stmts.html', anchor: 'the-continue-statement' },
    pass: { title: 'pass — No Operation', url: 'reference/simple_stmts.html', anchor: 'the-pass-statement' },
    lambda: { title: 'lambda — Anonymous Functions', url: 'reference/expressions.html', anchor: 'lambda-expressions' },
    global: { title: 'global — Global Variables', url: 'reference/simple_stmts.html', anchor: 'the-global-statement' },
    nonlocal: { title: 'nonlocal — Nonlocal Variables', url: 'reference/simple_stmts.html', anchor: 'the-nonlocal-statement' },
    raise: { title: 'raise — Raise Exception', url: 'reference/simple_stmts.html', anchor: 'the-raise-statement' },
    assert: { title: 'assert — Debug Assertion', url: 'reference/simple_stmts.html', anchor: 'the-assert-statement' },
    del: { title: 'del — Delete Statement', url: 'reference/simple_stmts.html', anchor: 'the-del-statement' },
    match: { title: 'match — Pattern Matching (Python 3.10+)', url: 'reference/compound_stmts.html', anchor: 'the-match-statement' },
    case: { title: 'case — Match Case (Python 3.10+)', url: 'reference/compound_stmts.html', anchor: 'the-match-statement' },
    // Built-ins
    print: { title: 'print() — Print Objects', url: 'library/functions.html', anchor: 'print' },
    len: { title: 'len() — Return Length', url: 'library/functions.html', anchor: 'len' },
    range: { title: 'range() — Range Object', url: 'library/functions.html', anchor: 'range' },
    enumerate: { title: 'enumerate() — Enumerate Object', url: 'library/functions.html', anchor: 'enumerate' },
    zip: { title: 'zip() — Zip Iterator', url: 'library/functions.html', anchor: 'zip' },
    map: { title: 'map() — Apply Function', url: 'library/functions.html', anchor: 'map' },
    filter: { title: 'filter() — Filter Elements', url: 'library/functions.html', anchor: 'filter' },
    sorted: { title: 'sorted() — Return Sorted List', url: 'library/functions.html', anchor: 'sorted' },
    reversed: { title: 'reversed() — Reverse Iterator', url: 'library/functions.html', anchor: 'reversed' },
    sum: { title: 'sum() — Sum Iterable', url: 'library/functions.html', anchor: 'sum' },
    max: { title: 'max() — Maximum Value', url: 'library/functions.html', anchor: 'max' },
    min: { title: 'min() — Minimum Value', url: 'library/functions.html', anchor: 'min' },
    abs: { title: 'abs() — Absolute Value', url: 'library/functions.html', anchor: 'abs' },
    round: { title: 'round() — Round Number', url: 'library/functions.html', anchor: 'round' },
    any: { title: 'any() — Any True', url: 'library/functions.html', anchor: 'any' },
    all: { title: 'all() — All True', url: 'library/functions.html', anchor: 'all' },
    open: { title: 'open() — Open File', url: 'library/functions.html', anchor: 'open' },
    isinstance: { title: 'isinstance() — Type Check', url: 'library/functions.html', anchor: 'isinstance' },
    issubclass: { title: 'issubclass() — Subclass Check', url: 'library/functions.html', anchor: 'issubclass' },
    getattr: { title: 'getattr() — Get Attribute', url: 'library/functions.html', anchor: 'getattr' },
    setattr: { title: 'setattr() — Set Attribute', url: 'library/functions.html', anchor: 'setattr' },
    hasattr: { title: 'hasattr() — Has Attribute', url: 'library/functions.html', anchor: 'hasattr' },
    delattr: { title: 'delattr() — Delete Attribute', url: 'library/functions.html', anchor: 'delattr' },
    id: { title: 'id() — Identity', url: 'library/functions.html', anchor: 'id' },
    pow: { title: 'pow() — Exponentiation', url: 'library/functions.html', anchor: 'pow' },
    iter: { title: 'iter() — Iterator', url: 'library/functions.html', anchor: 'iter' },
    next: { title: 'next() — Next Item', url: 'library/functions.html', anchor: 'next' },
    // Data types
    str: { title: 'str — String Type', url: 'library/stdtypes.html', anchor: 'text-sequence-type-str' },
    int: { title: 'int — Integer Type', url: 'library/functions.html', anchor: 'int' },
    float: { title: 'float — Floating Point', url: 'library/functions.html', anchor: 'float' },
    bool: { title: 'bool — Boolean Type', url: 'library/functions.html', anchor: 'bool' },
    list: { title: 'list — List Type', url: 'library/stdtypes.html', anchor: 'list' },
    dict: { title: 'dict — Dictionary Type', url: 'library/stdtypes.html', anchor: 'dict' },
    set: { title: 'set — Set Type', url: 'library/stdtypes.html', anchor: 'set' },
    tuple: { title: 'tuple — Tuple Type', url: 'library/stdtypes.html', anchor: 'tuple' },
    // Constants
    None: { title: 'None — Null Value', url: 'library/constants.html', anchor: 'None' },
    True: { title: 'True — Boolean True', url: 'library/constants.html', anchor: 'True' },
    False: { title: 'False — Boolean False', url: 'library/constants.html', anchor: 'False' },
    // Exceptions (partial list)
    Exception: { title: 'Exception — Base Exception', url: 'library/exceptions.html', anchor: 'Exception' },
    BaseException: { title: 'BaseException — Root of Exceptions', url: 'library/exceptions.html', anchor: 'BaseException' },
    ValueError: { title: 'ValueError — Invalid Value', url: 'library/exceptions.html', anchor: 'ValueError' },
    TypeError: { title: 'TypeError — Invalid Type', url: 'library/exceptions.html', anchor: 'TypeError' },
    KeyError: { title: 'KeyError — Missing Mapping Key', url: 'library/exceptions.html', anchor: 'KeyError' },
    IndexError: { title: 'IndexError — Sequence Index Out of Range', url: 'library/exceptions.html', anchor: 'IndexError' },
    StopIteration: { title: 'StopIteration — Iterator Exhausted', url: 'library/exceptions.html', anchor: 'StopIteration' }
};

export const BUILTIN_KEYWORDS = ['print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'sum', 'max', 'min', 'abs', 'round'];
export const DATA_TYPES = ['str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple'];
export const CONSTANTS = ['None', 'True', 'False'];

// Helper to map dunder names to the Data Model special method anchor
export function getDunderInfo(name: string): Info | undefined {
    if (!/^__.*__$/.test(name)) return undefined;
    // Most special methods have anchors like object.__init__, object.__getitem__, etc.
    const anchor = `object.${name}`;
    return { title: `${name} — Special method`, url: 'reference/datamodel.html', anchor };
}
