#!/usr/bin/env node
/*命令参数规则：
  process.argv[2]:业务参数/方法参数
  process.argv[3]:url
  process.argv[4]:文件夹名
*/
// 在 commit 之前检查是否有冲突，如果有冲突就 process.exit(1)
const execSync = require('child_process').execSync
require('shelljs/global')
// 变量
const runCmd = process.argv[2]
const url = process.argv[3] || "未指向仓库地址"
const subModule_folderName = process.argv[4] || "未命名文件夹"
const addFiles = process.argv[5] || "未申明提交文件"
let clone_url
const clone_option = "--recursive"
let subModule_url
//去空
function trim(str){
  return str.replace(/(^\s*)|(\s*$)/g, "");
}
//执行业务后，异常捕获
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
function gitInitFun(){
  //git init
  runFun("git init")
}
// 增加新的子模块
function gitAddSubModuleFun(){
  subModule_url = url || '未命名子仓库地址'
  // git subModule add --name subProject22332 https://github.com/yt46767/subProject2.git mainProject/subProject2
  runFun("git submodule add --force --name "+subModule_folderName+" "+subModule_url+" "+ subModule_folderName )
  // git add .gitmodules subProject1
  runFun("git add .gitmodules "+subModule_folderName)
  // git commit -m "subProject1 submodule"
  runFun('git commit -m "commit '+subModule_folderName+'"')
  // git submodule init
  runFun('git submodule init')
  // git push
  runFun('git push')
}
// 在主模块修改子模块代码，并提交
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
function updateAllModuleFun(){
  runFun("git submodule foreach git pull origin master")
  runFun('git pull origin master')
}
function updateSubModuleFun(){
  cd(subModule_folderName)
  runFun('git pull origin master')
  cd('..')
  runFun('git pull origin master')
}
function subModuleStatusFun(){
  cd(subModule_folderName)
  console.log(runFun('git status'))
  cd('..')
}
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
function mainModuleStatusFun(){
  console.log(runFun('git status'))
}
function commitMainModuleFun(){
  let temp1 = addFiles.split(',').join(' ')
  console.log(temp1)
  runFun('git add '+ temp1)
  temp1 = null
  runFun('git commit -m "git commit '+addFiles+'"')
  runFun('git push')
}
//修改
(function(){
  switch(runCmd){
    case 'addsubmodule':    //例如：npm run git addsubmodule https://github.com/yt46767/subProject1.git subProject909
      gitAddSubModuleFun()
      break
    case 'deletesubmodule': //例如：npm run git deletesubmodule - subProject909
      gitDeleteSubModuleFun()
      break
    case 'updateallmodule': //例如：npm run git updateallmodule
      updateAllModuleFun()
      break
    case 'updatesubmodule'://例如：npm run git updatesubmodule - subProject909
      updateSubModuleFun()
      break
    case 'submodulestatus'://例如：npm run git submodulestatus - subProject909
      subModuleStatusFun()
      break
    case 'commitsubmodule'://例如：npm run git commitsubmodule - subProject909 a.js,b.js
      commitSubModuleFun()
      break
    case 'mainmodulestatus'://例如：npm run git mainmodulestatus
      mainModuleStatusFun()
      break
    case 'commitmainmodule'://例如：npm run git commitmainmodule - - src/main.js
      commitMainModuleFun()
      break
  }
})()
