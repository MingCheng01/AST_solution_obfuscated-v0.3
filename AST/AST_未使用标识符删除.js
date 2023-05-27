const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Identifier_deletion(js_code) {
    ast_code = parse(js_code)

    function DelIdent(path) {
    // 标识符简化
    try {
        let node = path.node;//获取路径节点
        let funName = node.name;//函数名称

        let scope = path.scope;//获取路径的作用域
        let binding = scope.getBinding(funName);//获取绑定
        if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
            return;
        }

        let paths = binding.referencePaths;//绑定引用的路径

        if (paths.length === 0) {//被使用的次数为0，删除
            if (types.isCatchClause(path.parentPath)) return; //如果是try catch中的e,不处理
            path.parentPath.remove();
        } else {
            // console.log(paths.length);
            // console.log(paths.toString())
            // path.remove();
        }

    } catch (e) {
        //此处异常是因为，未使用的变量里面嵌套未使用的变量，删除时，直接从外层进行删除，但是缓存还在，删除内层时发现不存在导致的报错
    }

}

    traverse(ast_code, {Identifier: {exit: [DelIdent]}});
    return generator(ast_code).code
}