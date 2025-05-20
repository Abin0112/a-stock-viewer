/**
 * A股行情查看器 - API处理模块
 * 
 * 由于浏览器端无法直接访问A股数据API（跨域限制），
 * 这里我们使用模拟数据进行演示。在实际项目中，
 * 应该使用后端服务器进行API代理或使用支持CORS的API。
 */

const API = {
    // 存储模拟数据
    mockData: {
        // 股票基本信息
        stockInfo: {
            'sh000001': { code: 'sh000001', name: '上证指数', type: 'index' },
            'sz399001': { code: 'sz399001', name: '深证成指', type: 'index' },
            'sz399006': { code: 'sz399006', name: '创业板指', type: 'index' },
            'sh600000': { code: 'sh600000', name: '浦发银行', type: 'stock', industry: '银行' },
            'sh600036': { code: 'sh600036', name: '招商银行', type: 'stock', industry: '银行' },
            'sh601318': { code: 'sh601318', name: '中国平安', type: 'stock', industry: '保险' },
            'sh600519': { code: 'sh600519', name: '贵州茅台', type: 'stock', industry: '白酒' },
            'sh601988': { code: 'sh601988', name: '中国银行', type: 'stock', industry: '银行' },
            'sz000001': { code: 'sz000001', name: '平安银行', type: 'stock', industry: '银行' },
            'sz000002': { code: 'sz000002', name: '万科A', type: 'stock', industry: '房地产' },
            'sz000063': { code: 'sz000063', name: '中兴通讯', type: 'stock', industry: '通信设备' },
            'sz000333': { code: 'sz000333', name: '美的集团', type: 'stock', industry: '家电' },
            'sz000651': { code: 'sz000651', name: '格力电器', type: 'stock', industry: '家电' },
            'sz000858': { code: 'sz000858', name: '五粮液', type: 'stock', industry: '白酒' },
            'sz002594': { code: 'sz002594', name: '比亚迪', type: 'stock', industry: '汽车' }
        },
        
        // 热门股票列表
        hotStocks: ['sh600519', 'sz000858', 'sz002594', 'sh601318', 'sz000333']
    },
    
    // 生成随机价格数据
    generateRandomPrice(basePrice, volatility = 0.05) {
        const change = basePrice * volatility * (Math.random() * 2 - 1);
        return +(basePrice + change).toFixed(2);
    },
    
    // 生成随机涨跌幅
    generateRandomChange() {
        return +(Math.random() * 10 - 5).toFixed(2);
    },
    
    // 生成随机成交量（单位：手）
    generateRandomVolume() {
        return Math.floor(Math.random() * 1000000);
    },
    
    // 生成随机成交额（单位：万元）
    generateRandomAmount() {
        return Math.floor(Math.random() * 100000);
    },
    
    // 生成K线数据
    generateKLineData(days = 30) {
        const data = [];
        let basePrice = 100 + Math.random() * 100;
        const today = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // 生成当天的开盘价、收盘价、最高价、最低价
            const open = this.generateRandomPrice(basePrice, 0.02);
            const close = this.generateRandomPrice(basePrice, 0.02);
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            
            // 确保价格为正数且保留两位小数
            const item = {
                date: date.toISOString().split('T')[0],
                open: +open.toFixed(2),
                close: +close.toFixed(2),
                high: +high.toFixed(2),
                low: +low.toFixed(2),
                volume: this.generateRandomVolume()
            };
            
            data.push(item);
            basePrice = close; // 下一天的基准价格为当天的收盘价
        }
        
        return data;
    },
    
    // 生成分时图数据
    generateTimeLineData() {
        const data = [];
        const today = new Date();
        today.setHours(9, 30, 0, 0); // 设置为开盘时间9:30
        
        let basePrice = 100 + Math.random() * 100;
        const baseVolume = Math.floor(Math.random() * 10000);
        
        // 上午交易时段：9:30 - 11:30
        for (let i = 0; i < 120; i++) {
            const time = new Date(today);
            time.setMinutes(time.getMinutes() + i);
            
            if (time.getHours() === 11 && time.getMinutes() > 30) {
                break;
            }
            
            const price = this.generateRandomPrice(basePrice, 0.005);
            const volume = Math.floor(baseVolume * (0.5 + Math.random()));
            
            data.push({
                time: time.toTimeString().substring(0, 5),
                price: +price.toFixed(2),
                volume: volume
            });
            
            basePrice = price;
        }
        
        // 下午交易时段：13:00 - 15:00
        today.setHours(13, 0, 0, 0);
        for (let i = 0; i < 120; i++) {
            const time = new Date(today);
            time.setMinutes(time.getMinutes() + i);
            
            if (time.getHours() === 15 && time.getMinutes() > 0) {
                break;
            }
            
            const price = this.generateRandomPrice(basePrice, 0.005);
            const volume = Math.floor(baseVolume * (0.5 + Math.random()));
            
            data.push({
                time: time.toTimeString().substring(0, 5),
                price: +price.toFixed(2),
                volume: volume
            });
            
            basePrice = price;
        }
        
        return data;
    },
    
    // 生成财务数据
    generateFinancialData() {
        return {
            // 市值数据
            marketValue: {
                totalMarketValue: +(Math.random() * 10000).toFixed(2), // 总市值（亿元）
                circulatingMarketValue: +(Math.random() * 8000).toFixed(2) // 流通市值（亿元）
            },
            
            // 交易数据
            tradingData: {
                peRatio: +(Math.random() * 50 + 5).toFixed(2), // 市盈率
                pbRatio: +(Math.random() * 5 + 0.5).toFixed(2), // 市净率
                turnoverRate: +(Math.random() * 5).toFixed(2), // 换手率（%）
                dividend: +(Math.random() * 3).toFixed(2) // 股息率（%）
            },
            
            // 最近财报数据
            financialReport: {
                revenue: +(Math.random() * 1000).toFixed(2), // 营收（亿元）
                netProfit: +(Math.random() * 100).toFixed(2), // 净利润（亿元）
                growthRate: +(Math.random() * 30 - 10).toFixed(2), // 同比增长率（%）
                roe: +(Math.random() * 20).toFixed(2) // 净资产收益率（%）
            }
        };
    },
    
    // 生成新闻数据
    generateNewsData(count = 5) {
        const newsTitles = [
            '央行定调下半年货币政策：保持流动性合理充裕',
            '证监会：进一步提高上市公司质量',
            '两市成交额连续三日破万亿',
            '创业板注册制改革满一周年',
            '银保监会：防范化解金融风险攻坚战取得重要阶段性成果',
            '央行：稳步推进数字人民币研发',
            '沪深交易所修订上市规则',
            '证监会：完善资本市场基础制度',
            '财政部：积极的财政政策要提质增效、更可持续',
            '发改委：加快形成以国内大循环为主体的新发展格局'
        ];
        
        const sources = ['证券时报', '上海证券报', '中国证券报', '金融时报', '经济参考报'];
        const today = new Date();
        
        const news = [];
        for (let i = 0; i < count; i++) {
            const titleIndex = Math.floor(Math.random() * newsTitles.length);
            const sourceIndex = Math.floor(Math.random() * sources.length);
            
            const time = new Date(today);
            time.setHours(time.getHours() - Math.floor(Math.random() * 24));
            
            news.push({
                id: 'news-' + i,
                title: newsTitles[titleIndex],
                source: sources[sourceIndex],
                time: time.toLocaleString(),
                summary: '这是一条关于A股市场的模拟新闻，用于演示A股行情查看器的功能。实际项目中应该从新闻API获取真实数据。'
            });
        }
        
        return news;
    },
    
    // 获取股票列表
    async getStockList() {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return Object.values(this.mockData.stockInfo);
    },
    
    // 搜索股票
    async searchStock(keyword) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!keyword) {
            return [];
        }
        
        keyword = keyword.toLowerCase();
        return Object.values(this.mockData.stockInfo).filter(stock => {
            return stock.code.toLowerCase().includes(keyword) || 
                   stock.name.toLowerCase().includes(keyword);
        });
    },
    
    // 获取股票详情
    async getStockDetail(code) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const stockInfo = this.mockData.stockInfo[code];
        if (!stockInfo) {
            throw new Error('股票不存在');
        }
        
        const basePrice = 100 + Math.random() * 100;
        const currentPrice = this.generateRandomPrice(basePrice);
        const change = this.generateRandomChange();
        const changePercent = change.toFixed(2) + '%';
        const changeAmount = (currentPrice * change / 100).toFixed(2);
        
        return {
            ...stockInfo,
            currentPrice: currentPrice.toFixed(2),
            change: change > 0 ? '+' + changePercent : changePercent,
            changeAmount: change > 0 ? '+' + changeAmount : changeAmount,
            volume: this.generateRandomVolume(),
            amount: this.generateRandomAmount(),
            high: (currentPrice * (1 + Math.random() * 0.05)).toFixed(2),
            low: (currentPrice * (1 - Math.random() * 0.05)).toFixed(2),
            open: (currentPrice * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2),
            preClose: (currentPrice * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2),
            date: new Date().toLocaleDateString()
        };
    },
    
    // 获取K线数据
    async getKLineData(code, period = 'daily', count = 30) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 700));
        
        return this.generateKLineData(count);
    },
    
    // 获取分时图数据
    async getTimeLineData(code) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return this.generateTimeLineData();
    },
    
    // 获取大盘指数
    async getMarketIndices() {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const indices = ['sh000001', 'sz399001', 'sz399006'];
        const result = [];
        
        for (const code of indices) {
            const basePrice = 3000 + Math.random() * 1000;
            const currentPrice = this.generateRandomPrice(basePrice);
            const change = this.generateRandomChange();
            const changePercent = change.toFixed(2) + '%';
            
            result.push({
                code,
                name: this.mockData.stockInfo[code].name,
                currentPrice: currentPrice.toFixed(2),
                change: change > 0 ? '+' + changePercent : changePercent,
                changeClass: change > 0 ? 'stock-up' : (change < 0 ? 'stock-down' : 'stock-unchanged')
            });
        }
        
        return result;
    },
    
    // 获取热门股票
    async getHotStocks() {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const result = [];
        
        for (const code of this.mockData.hotStocks) {
            const basePrice = 100 + Math.random() * 100;
            const currentPrice = this.generateRandomPrice(basePrice);
            const change = this.generateRandomChange();
            const changePercent = change.toFixed(2) + '%';
            
            result.push({
                code,
                name: this.mockData.stockInfo[code].name,
                currentPrice: currentPrice.toFixed(2),
                change: change > 0 ? '+' + changePercent : changePercent,
                changeClass: change > 0 ? 'stock-up' : (change < 0 ? 'stock-down' : 'stock-unchanged')
            });
        }
        
        return result;
    },
    
    // 获取财经新闻
    async getNews(count = 5) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return this.generateNewsData(count);
    },
    
    // 获取股票相关新闻
    async getStockNews(code, count = 3) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const stockInfo = this.mockData.stockInfo[code];
        if (!stockInfo) {
            throw new Error('股票不存在');
        }
        
        const news = this.generateNewsData(count);
        // 修改新闻标题，使其与特定股票相关
        return news.map(item => ({
            ...item,
            title: `${stockInfo.name}${item.title}`
        }));
    },
    
    // 获取股票财务数据
    async getStockFinancialData(code) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const stockInfo = this.mockData.stockInfo[code];
        if (!stockInfo) {
            throw new Error('股票不存在');
        }
        
        return this.generateFinancialData();
    }
};

// 导出API对象
window.StockAPI = API;