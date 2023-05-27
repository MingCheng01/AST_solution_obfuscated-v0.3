const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Try_catch_simplification(js_code) {
    ast_code = parse(js_code)

    function del_TryStatement(path) {
        // try-catch 语句简化
        if (path.node.block) {
            if (path.node.finalizer) return;
            path.replaceInline(path.node.block.body);

        }
    }

    traverse(ast_code, {TryStatement: {exit: [del_TryStatement]}});

    return generator(ast_code).code
}