const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Delete_the_empty_statement(js_code) {
    ast_code = parse(js_code)

    function remove_path(path) {
        //删除EmptyStatement
        path.remove()
    }

    traverse(ast_code, {EmptyStatement: {exit: [remove_path]}});

    return generator(ast_code).code
}