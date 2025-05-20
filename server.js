const express = require('express');
const path = require('path');

// 创建Express应用
const app = express();

// 设置静态文件目录
app.use(express.static(__dirname));

// 所有路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 设置端口
const PORT = process.env.PORT || 5001;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，请访问: http://localhost:${PORT}`);
  console.log('按 Ctrl+C 停止服务器');
});