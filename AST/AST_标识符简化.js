const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

//标识符 - 重复赋值
function Duplicate_assignment_of_identifiers(js_code) {
    ast_code = parse(js_code)//刷新ast
    traverse(ast_code, {VariableDeclarator: {exit: [ReIdent]},});

    function ReIdent(path) {
        // 标识符简化
        let node = path.node;//获取路径节点
        if (!types.isIdentifier(node.id) || !types.isIdentifier(node.init)) return;

        let leftName = node.id.name;//函数名称
        let rightName = node.init.name;//函数名称

        let scope = path.scope;//获取路径的作用域
        let binding = scope.getBinding(leftName);//获取绑定
        if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
            return;
        }
        let paths = binding.referencePaths;//绑定引用的路径
        let paths_sums = 0;
        paths.map(function (refer_path) {
            refer_path.node.name = rightName;//标识符重命名
            paths_sums += 1;//路径+1
        });
        if (paths_sums === paths.length && paths_sums !== 0) {//若绑定的每个路径都已处理 ，则移除当前路径
            path.remove();//删除路径
        }
    }

    return generator(ast_code).code
}

