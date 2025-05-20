# A股行情查看器

一个用于查看A股行情、股票对比、大盘概览和财经新闻的前端网页应用。

![A股行情查看器](https://via.placeholder.com/800x400?text=A股行情查看器)

## 功能特点

### 1. 首页 - 股票行情

- 自选股列表展示与管理
- 股票详情查看（K线图、分时图）
- 财务数据分析
- 大盘指数实时展示
- 热门股票推荐
- 最新财经新闻

### 2. 走势对比 - 多股票比较

- 多只股票走势对比功能
- 支持不同周期（7天、1个月、3个月等）
- 支持不同对比方式（涨跌幅、价格）
- 对比分析结果展示

### 3. 大盘概览 - 市场全景

- 大盘指数实时展示
- 行业板块涨跌情况
- 市场涨跌分布统计
- 行业资金流向分析
- 市场排行榜（涨幅榜、跌幅榜等）

### 4. 财经新闻 - 资讯中心

- 财经新闻分类浏览
- 热门新闻推荐
- 新闻详情查看
- 相关股票推荐

## 安装与使用

### 环境要求

- Python 3.x

### 快速开始

#### 方法一：使用启动脚本（推荐）

**Linux/macOS用户：**

```bash
cd a-stock-viewer
chmod +x start.sßh  # 如果尚未添加执行权限
./start.sh
```

#### 方法二：手动启动

```bash
cd a-stock-viewer
python3 server.py
```

启动后，在浏览器中访问：http://localhost:5001 即可使用A股行情查看器。

## 项目结构

```
a-stock-viewer/
├── index.html          # 首页 - 股票行情
├── compare.html        # 走势对比页面
├── market.html         # 大盘概览页面
├── news.html           # 财经新闻页面
├── server.py           # Python HTTP服务器
├── server.js           # Node.js HTTP服务器（备选）
├── package.json        # Node.js项目配置
├── start.sh            # Linux/macOS启动脚本
├── start.bat           # Windows启动脚本
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── api.js          # API处理模块
│   ├── chart.js        # 图表处理模块
│   ├── main.js         # 主页逻辑
│   ├── compare.js      # 走势对比逻辑
│   ├── market.js       # 大盘概览逻辑
│   └── news.js         # 财经新闻逻辑
└── img/                # 图片资源目录
```

## 技术栈

- **前端框架**：HTML5, CSS3, JavaScript
- **UI框架**：Bootstrap 5
- **图表库**：ECharts 5
- **HTTP服务器**：Python SimpleHTTPServer / Node.js Express

## 数据说明

本应用使用模拟数据进行展示，在实际项目中可以替换为真实的A股数据API。由于浏览器端无法直接访问A股数据API（跨域限制），实际项目中应该使用后端服务器进行API代理或使用支持CORS的API。

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Edge
- Safari

## 开发说明

### 添加新股票数据

在 `js/api.js` 文件中的 `mockData.stockInfo` 对象中添加新的股票信息。

### 自定义样式

修改 `css/style.css` 文件以自定义应用的外观。

### 扩展功能

可以通过修改相应的JavaScript文件来扩展功能：

- 添加新的图表类型：修改 `js/chart.js`
- 添加新的API接口：修改 `js/api.js`
- 添加新的页面功能：创建新的HTML和JS文件

## 许可证

MIT License

## 免责声明

本应用仅供学习和演示使用，所有数据均为模拟数据，不构成任何投资建议。使用者应自行承担使用本应用的风险。

## 联系方式

如有问题或建议，请联系：example@example.com