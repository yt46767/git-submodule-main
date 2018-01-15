// console.log("script变量："+process.argv[2]);
// console.log("script变量数组："+ process.argv.toString());
// console.log("script变量数组："+ JSON.stringify(process.env.jspath));
// console.log("script变量数组："+ JSON.stringify(process.env));
var Git = require("./"+process.env.jspath+".js");
