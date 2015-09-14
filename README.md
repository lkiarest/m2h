# m2h

使用markdown格式文本直接生成静态文档网站

服务器不需要支持动态脚本，生成后直接发布静态网站

使用方法：
执行 default gulp 任务，在source/content中放置的markdown文档会自动生成content目录下的html文件，同时菜单项会在index中生成，
直接将目录拷贝到服务器中即可。

markdown源文件头需要固定格式，可参考示例。

目录结构：

* conf __配置文件目录__
* less __less文件目录，生成样式__
* resources **图片等资源文件目录**
* source **源文件目录**
  * content **markdown内容页目录**
  * index.md **首页目录**
* tmpl **模板页目录**
  * layout.hogan **布局模板**
* vendor **第三方lib目录**
* gulpfile.js **gulp脚本文件**
* node_modules **npm**

