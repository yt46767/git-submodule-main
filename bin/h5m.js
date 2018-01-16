#!/usr/bin/env node
/*命令行参数定义：
  process.argv[1]:执行脚本
  process.argv[2]:业务命令
  process.argv[3]:仓库地址
  process.argv[4]:子模块文件夹名
  process.argv[5]:提交文件
*/
//在 commit 之前检查是否有冲突，如果有冲突就 process.exit(1)
const execSync = require('child_process').execSync
require('shelljs/global')
//申明变量
const runCmd = process.argv[2]
const url = process.argv[3] || "未指向仓库地址"
const subModule_folderName = process.argv[4] || "未命名文件夹"
const addFiles = process.argv[5] || "未申明提交文件"
let clone_url
const clone_option = "--recursive"
let subModule_url
//字符串前后去空
function trim(str){
  return str.replace(/(^\s*)|(\s*$)/g, "");
}
//命令执行中异常捕获
function runFun(f){
  // git 对所有冲突的地方都会生成下面这种格式的信息，所以写个检测冲突文件的正则
  const isConflictRegular = "^<<<<<<<\\s|^=======$|^>>>>>>>\\s"
  let rs = execSync(f, {encoding: 'utf-8'})
  let results
  let msg = arguments[1] || '没有发现冲突!'
  try {
      // git grep 命令会执行 perl 的正则匹配所有满足冲突条件的文件
      results = execSync(`git grep -n -P "${isConflictRegular}"`, {encoding: 'utf-8'})
  } catch (e) {
      return rs;
      // console.log(msg)
      process.exit(0)
  }
  if(results) {
      console.error('发现冲突，请解决后再提交，冲突文件：')
      console.error(results.trim())
      process.exit(1)
  }
  process.exit(0)
}
//增加新子模块
function gitAddSubModuleFun(){
  subModule_url = url || '未命名子仓库地址'
  runFun("git submodule add --force --name "+subModule_folderName+" "+subModule_url+" "+ subModule_folderName )
  // 主模块提交子模块版本信息
  runFun("git add .gitmodules "+subModule_folderName)
  runFun('git commit -m "commit '+subModule_folderName+'"')
  runFun('git submodule init')
  runFun('git push')
}
//主模块中提交子模块
function gitDeleteSubModuleFun(){
  console.log(runFun("pwd"))
  runFun("git rm "+subModule_folderName)
  cd('.git')
  console.log(runFun("pwd"))
  //删除带subModule_folderName字符串的某一行以及后面1行
  const gitConfig_file ="config"
  startLine=`sed -n '/`+subModule_folderName+`/=' `+gitConfig_file //先计算带subModule_folderName字符串行的行号
  startLine = parseInt(runFun(startLine))
  lineAfter = 1
  let endLine = startLine + lineAfter
  runFun("sed -i '' '"+startLine+","+endLine+"d' "+gitConfig_file,'在.git/config文件里，submodule相关配置已删除')
  cd('..')
  //提交代码
  runFun("git add .")
  runFun("git commit -a -m 'remove "+subModule_folderName+"'")
  runFun("git push")
}
//更新所有模块
function updateAllModuleFun(){
  runFun("git submodule update --init --recursive")
  runFun("git submodule foreach git pull origin master")
  runFun('git pull origin master')
}
//更新子模块
function updateSubModuleFun(){
  cd(subModule_folderName)
  runFun('git pull origin master')
  cd('..')
  runFun('git pull origin master')
}
//查询子模块状态
function subModuleStatusFun(){
  cd(subModule_folderName)
  console.log(runFun('git status'))
  cd('..')
}
//提交子模块
function commitSubModuleFun(){
  cd(subModule_folderName)
  let temp1 = addFiles.split(',').join(' ')
  console.log(temp1)
  runFun('git add '+ temp1)
  temp1 = null
  runFun('git commit -m "git commit '+addFiles+'"')
  runFun('git push')
  cd('..')
  runFun('git add '+subModule_folderName)
  runFun('git commit -m "git commit '+subModule_folderName+'"')
  runFun('git push')
}
//查询主模块状态
function mainModuleStatusFun(){
  console.log(runFun('git status'))
}
//提交主模块
function commitMainModuleFun(){
  let temp1 = addFiles.split(',').join(' ')
  console.log(temp1)
  runFun('git add '+ temp1)
  temp1 = null
  runFun('git commit -m "git commit '+addFiles+'"')
  runFun('git push')
}
//业务判断
(function(){
  switch(runCmd){
    case 'addsubmodule':    //例如：h5m addsubmodule https://github.com/yt46767/subProject1.git subProject909
      gitAddSubModuleFun()
      break
    case 'deletesubmodule': //例如：h5m deletesubmodule - subProject909
      gitDeleteSubModuleFun()
      break
    case 'updateallmodule': //例如：h5m updateallmodule
      updateAllModuleFun()
      break
    case 'updatesubmodule': //例如：h5m updatesubmodule - subProject909
      updateSubModuleFun()
      break
    case 'submodulestatus': //例如：h5m submodulestatus - subProject909
      subModuleStatusFun()
      break
    case 'commitsubmodule': //例如：h5m commitsubmodule - subProject909 a.js,b.js
      commitSubModuleFun()
      break
    case 'mainmodulestatus'://例如：h5m mainmodulestatus
      mainModuleStatusFun()
      break
    case 'commitmainmodule'://例如：h5m commitmainmodule - - bin/h5m.js
      commitMainModuleFun()
      break
  }
})()
