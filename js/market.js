/**
 * A股行情查看器 - 大盘概览模块
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化大盘概览功能
    MarketApp.init();
});

// 大盘概览应用对象
const MarketApp = {
    // 当前选择的行业板块周期（天数）
    industryPeriod: 1,
    
    // 当前选择的排行类型（up: 涨幅榜, down: 跌幅榜, volume: 成交量榜, turnover: 换手率榜）
    rankType: 'up',
    
    // 数据缓存
    dataCache: {},
    
    // 初始化应用
    init() {
        // 初始化事件监听
        this.initEventListeners();
        
        // 加载大盘数据
        this.loadMarketData();
    },
    
    // 初始化事件监听
    initEventListeners() {
        // 行业板块周期选择事件
        const periodRadios = document.querySelectorAll('input[name="industry-period"]');
        periodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.industryPeriod = parseInt(radio.value);
                    this.loadIndustrySectors();
                }
            });
        });
        
        // 排行类型选择事件
        const rankTypeRadios = document.querySelectorAll('input[name="rank-type"]');
        rankTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.rankType = radio.value;
                    this.loadMarketRank();
                }
            });
        });
        
        // 搜索表单提交事件
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const keyword = document.getElementById('stock-search').value.trim();
                if (keyword) {
                    this.searchStock(keyword);
                }
            });
        }
    },
    
    // 加载大盘数据
    async loadMarketData() {
        try {
            // 并行加载多个数据
            await Promise.all([
                this.loadMarketIndices(),
                this.loadIndexCharts(),
                this.loadIndustrySectors(),
                this.loadMarketDistribution(),
                this.loadIndustryFundFlow(),
                this.loadMarketRank()
            ]);
        } catch (error) {
            console.error('加载大盘数据失败:', error);
            alert('加载数据失败，请刷新页面重试');
        }
    },
    
    // 加载大盘指数
    async loadMarketIndices() {
        const marketIndicesContainer = document.getElementById('market-indices');
        if (!marketIndicesContainer) return;
        
        try {
            const indices = await StockAPI.getMarketIndices();
            
            // 清空容器
            marketIndicesContainer.innerHTML = '';
            
            // 添加指数数据
            indices.forEach(index => {
                const indexCard = document.createElement('div');
                indexCard.className = 'col-md-4 mb-3';
                
                // 设置涨跌样式类
                const changeClass = index.changeClass;
                
                indexCard.innerHTML = `
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">${index.name}</h5>
                            <p class="card-text mb-0">
                                <span class="fs-3 ${changeClass}">${index.currentPrice}</span>
                            </p>
                            <p class="card-text">
                                <span class="${changeClass}">${index.change}</span>
                            </p>
                        </div>
                    </div>
                `;
                
                marketIndicesContainer.appendChild(indexCard);
            });
        } catch (error) {
            console.error('加载大盘指数失败:', error);
            marketIndicesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        加载大盘指数失败，请刷新页面重试
                    </div>
                </div>
            `;
        }
    },
    
    // 加载指数图表
    async loadIndexCharts() {
        try {
            // 加载上证指数K线数据
            const shIndexData = await StockAPI.getKLineData('sh000001', 'daily', 90);
            ChartManager.drawMarketIndexChart('sh-index-chart', shIndexData, '上证指数');
            
            // 加载深证成指K线数据
            const szIndexData = await StockAPI.getKLineData('sz399001', 'daily', 90);
            ChartManager.drawMarketIndexChart('sz-index-chart', szIndexData, '深证成指');
        } catch (error) {
            console.error('加载指数图表失败:', error);
            document.getElementById('sh-index-chart').innerHTML = '<div class="alert alert-danger">加载图表失败</div>';
            document.getElementById('sz-index-chart').innerHTML = '<div class="alert alert-danger">加载图表失败</div>';
        }
    },
    
    // 加载行业板块
    async loadIndustrySectors() {
        const industrySectorsContainer = document.getElementById('industry-sectors');
        if (!industrySectorsContainer) return;
        
        try {
            // 显示加载中状态
            industrySectorsContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            `;
            
            // 模拟获取行业板块数据
            const sectors = await this.getIndustrySectors(this.industryPeriod);
            
            // 清空容器
            industrySectorsContainer.innerHTML = '';
            
            // 添加行业板块数据
            sectors.forEach(sector => {
                const sectorCard = document.createElement('div');
                sectorCard.className = 'col-md-3 col-sm-6 mb-3';
                
                // 设置涨跌样式类
                const changeClass = parseFloat(sector.change) > 0 ? 'stock-up' : 
                                   (parseFloat(sector.change) < 0 ? 'stock-down' : 'stock-unchanged');
                
                // 计算进度条宽度（最大为100%）
                const progressWidth = Math.min(Math.abs(parseFloat(sector.change)) * 10, 100);
                const progressClass = parseFloat(sector.change) > 0 ? 'bg-danger' : 'bg-success';
                
                sectorCard.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${sector.name}</h6>
                            <p class="card-text mb-1">
                                <span class="${changeClass}">${sector.change}%</span>
                            </p>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar ${progressClass}" role="progressbar" 
                                    style="width: ${progressWidth}%" aria-valuenow="${progressWidth}" 
                                    aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="card-text mt-2 small">
                                <span>领涨：${sector.topStock}</span>
                                <span class="${changeClass} float-end">${sector.topChange}%</span>
                            </p>
                        </div>
                    </div>
                `;
                
                industrySectorsContainer.appendChild(sectorCard);
            });
        } catch (error) {
            console.error('加载行业板块失败:', error);
            industrySectorsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        加载行业板块失败，请刷新页面重试
                    </div>
                </div>
            `;
        }
    },
    
    // 加载市场涨跌分布
    async loadMarketDistribution() {
        try {
            // 模拟获取市场涨跌分布数据
            const distributionData = await this.getMarketDistribution();
            
            // 初始化图表
            const chart = echarts.init(document.getElementById('market-distribution-chart'));
            
            // 设置图表选项
            const option = {
                title: {
                    text: '市场涨跌分布',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: distributionData.map(item => item.name)
                },
                series: [
                    {
                        name: '涨跌分布',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: {
                            show: false,
                            position: 'center'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: '18',
                                fontWeight: 'bold'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: distributionData
                    }
                ],
                color: ['#f44336', '#e91e63', '#ff9800', '#4caf50', '#2196f3']
            };
            
            // 设置图表选项并渲染
            chart.setOption(option);
            
            // 监听窗口大小变化，调整图表大小
            window.addEventListener('resize', () => {
                chart.resize();
            });
        } catch (error) {
            console.error('加载市场涨跌分布失败:', error);
            document.getElementById('market-distribution-chart').innerHTML = '<div class="alert alert-danger">加载图表失败</div>';
        }
    },
    
    // 加载行业资金流向
    async loadIndustryFundFlow() {
        try {
            // 模拟获取行业资金流向数据
            const fundFlowData = await this.getIndustryFundFlow();
            
            // 初始化图表
            const chart = echarts.init(document.getElementById('industry-fund-flow-chart'));
            
            // 处理数据
            const industries = fundFlowData.map(item => item.name);
            const values = fundFlowData.map(item => item.value);
            const colors = fundFlowData.map(item => (item.value >= 0 ? '#f44336' : '#4caf50'));
            
            // 设置图表选项
            const option = {
                title: {
                    text: '行业资金流向（亿元）',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    formatter: function(params) {
                        const data = params[0];
                        return `${data.name}: ${data.value}亿元`;
                    }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: '{value}亿元'
                    }
                },
                yAxis: {
                    type: 'category',
                    data: industries,
                    inverse: true
                },
                series: [
                    {
                        name: '资金流向',
                        type: 'bar',
                        data: values,
                        itemStyle: {
                            color: function(params) {
                                return colors[params.dataIndex];
                            }
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{c}亿元'
                        }
                    }
                ]
            };
            
            // 设置图表选项并渲染
            chart.setOption(option);
            
            // 监听窗口大小变化，调整图表大小
            window.addEventListener('resize', () => {
                chart.resize();
            });
        } catch (error) {
            console.error('加载行业资金流向失败:', error);
            document.getElementById('industry-fund-flow-chart').innerHTML = '<div class="alert alert-danger">加载图表失败</div>';
        }
    },
    
    // 加载市场排行
    async loadMarketRank() {
        const marketRankBody = document.getElementById('market-rank-body');
        if (!marketRankBody) return;
        
        try {
            // 显示加载中状态
            marketRankBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;
            
            // 模拟获取市场排行数据
            const rankData = await this.getMarketRank(this.rankType);
            
            // 清空表格内容
            marketRankBody.innerHTML = '';
            
            // 添加排行数据
            rankData.forEach((stock, index) => {
                // 设置涨跌样式类
                const changeClass = parseFloat(stock.changePercent) > 0 ? 'stock-up' : 
                                   (parseFloat(stock.changePercent) < 0 ? 'stock-down' : 'stock-unchanged');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${stock.code}</td>
                    <td>${stock.name}</td>
                    <td class="${changeClass}">${stock.price}</td>
                    <td class="${changeClass}">${stock.changePercent}%</td>
                    <td class="${changeClass}">${stock.changeAmount}</td>
                    <td>${stock.volume}</td>
                    <td>${stock.amount}</td>
                    <td>${stock.turnoverRate}%</td>
                `;
                
                marketRankBody.appendChild(row);
            });
        } catch (error) {
            console.error('加载市场排行失败:', error);
            marketRankBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-3">
                        <div class="alert alert-danger mb-0">
                            加载市场排行失败，请刷新页面重试
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    // 搜索股票
    async searchStock(keyword) {
        try {
            const results = await StockAPI.searchStock(keyword);
            
            if (results.length === 0) {
                alert('未找到匹配的股票');
                return;
            }
            
            // 如果只有一个结果，直接跳转到详情页
            if (results.length === 1) {
                window.location.href = `index.html?code=${results[0].code}`;
                return;
            }
            
            // 如果有多个结果，显示选择列表
            // TODO: 实现搜索结果选择列表
            window.location.href = `index.html?code=${results[0].code}`;
        } catch (error) {
            console.error('搜索股票失败:', error);
            alert('搜索失败，请重试');
        }
    },
    
    // 获取行业板块数据（模拟数据）
    async getIndustrySectors(period) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 行业板块列表
        const sectors = [
            { name: '银行', change: '+2.35', topStock: '招商银行', topChange: '+4.21' },
            { name: '保险', change: '+1.87', topStock: '中国平安', topChange: '+3.56' },
            { name: '证券', change: '+1.65', topStock: '中信证券', topChange: '+2.98' },
            { name: '房地产', change: '-0.78', topStock: '万科A', topChange: '+1.23' },
            { name: '医药', change: '-1.25', topStock: '恒瑞医药', topChange: '+0.87' },
            { name: '食品饮料', change: '+3.42', topStock: '贵州茅台', topChange: '+5.67' },
            { name: '家电', change: '+0.95', topStock: '格力电器', topChange: '+2.11' },
            { name: '汽车', change: '+1.32', topStock: '比亚迪', topChange: '+3.45' },
            { name: '电子', change: '-0.56', topStock: '京东方A', topChange: '+1.78' },
            { name: '通信', change: '-0.89', topStock: '中兴通讯', topChange: '+0.65' },
            { name: '计算机', change: '-1.45', topStock: '浪潮信息', topChange: '+0.92' },
            { name: '传媒', change: '-2.13', topStock: '分众传媒', topChange: '+0.45' }
        ];
        
        // 根据周期调整数据
        if (period === 5) {
            // 5日数据
            sectors.forEach(sector => {
                sector.change = (parseFloat(sector.change) * 1.5).toFixed(2);
                if (sector.change > 0) sector.change = '+' + sector.change;
                
                sector.topChange = (parseFloat(sector.topChange) * 1.8).toFixed(2);
                if (sector.topChange > 0) sector.topChange = '+' + sector.topChange;
            });
        } else if (period === 30) {
            // 30日数据
            sectors.forEach(sector => {
                sector.change = (parseFloat(sector.change) * 3).toFixed(2);
                if (sector.change > 0) sector.change = '+' + sector.change;
                
                sector.topChange = (parseFloat(sector.topChange) * 3.5).toFixed(2);
                if (sector.topChange > 0) sector.topChange = '+' + sector.topChange;
            });
        }
        
        return sectors;
    },
    
    // 获取市场涨跌分布数据（模拟数据）
    async getMarketDistribution() {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 400));
        
        return [
            { value: 423, name: '涨停', itemStyle: { color: '#f44336' } },
            { value: 1256, name: '上涨', itemStyle: { color: '#ff9800' } },
            { value: 187, name: '平盘', itemStyle: { color: '#9e9e9e' } },
            { value: 876, name: '下跌', itemStyle: { color: '#4caf50' } },
            { value: 156, name: '跌停', itemStyle: { color: '#2196f3' } }
        ];
    },
    
    // 获取行业资金流向数据（模拟数据）
    async getIndustryFundFlow() {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return [
            { name: '食品饮料', value: 35.67 },
            { name: '银行', value: 28.45 },
            { name: '保险', value: 15.23 },
            { name: '汽车', value: 12.78 },
            { name: '家电', value: 8.92 },
            { name: '证券', value: 5.34 },
            { name: '电子', value: -6.78 },
            { name: '房地产', value: -8.45 },
            { name: '医药', value: -12.34 },
            { name: '计算机', value: -15.67 }
        ];
    },
    
    // 获取市场排行数据（模拟数据）
    async getMarketRank(type) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 基础股票数据
        const stocks = [
            { code: 'sh600519', name: '贵州茅台', price: '1856.00', changePercent: '+5.43', changeAmount: '+95.67', volume: '125678', amount: '233456.78', turnoverRate: '1.23' },
            { code: 'sh601318', name: '中国平安', price: '56.78', changePercent: '+3.56', changeAmount: '+1.95', volume: '3456789', amount: '196345.67', turnoverRate: '3.45' },
            { code: 'sh600036', name: '招商银行', price: '45.67', changePercent: '+4.21', changeAmount: '+1.84', volume: '2345678', amount: '107234.56', turnoverRate: '2.87' },
            { code: 'sz000858', name: '五粮液', price: '178.90', changePercent: '+4.87', changeAmount: '+8.31', volume: '987654', amount: '176543.21', turnoverRate: '2.34' },
            { code: 'sz002594', name: '比亚迪', price: '245.67', changePercent: '+3.45', changeAmount: '+8.19', volume: '1234567', amount: '303456.78', turnoverRate: '4.56' },
            { code: 'sh600276', name: '恒瑞医药', price: '56.78', changePercent: '+0.87', changeAmount: '+0.49', volume: '876543', amount: '49765.43', turnoverRate: '1.45' },
            { code: 'sz000651', name: '格力电器', price: '38.45', changePercent: '+2.11', changeAmount: '+0.79', volume: '2345678', amount: '90123.45', turnoverRate: '3.21' },
            { code: 'sz000002', name: '万科A', price: '18.76', changePercent: '+1.23', changeAmount: '+0.23', volume: '3456789', amount: '64789.12', turnoverRate: '3.78' },
            { code: 'sh601166', name: '兴业银行', price: '18.34', changePercent: '+2.57', changeAmount: '+0.46', volume: '2345678', amount: '43012.34', turnoverRate: '2.56' },
            { code: 'sh600887', name: '伊利股份', price: '32.45', changePercent: '+1.98', changeAmount: '+0.63', volume: '1234567', amount: '40012.34', turnoverRate: '2.12' }
        ];
        
        // 根据排行类型返回不同的数据
        if (type === 'up') {
            // 涨幅榜
            return stocks.sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent));
        } else if (type === 'down') {
            // 跌幅榜（将涨跌数据取反）
            return stocks.map(stock => {
                const newStock = { ...stock };
                newStock.changePercent = (parseFloat(stock.changePercent) * -1).toFixed(2);
                if (newStock.changePercent > 0) newStock.changePercent = '+' + newStock.changePercent;
                
                newStock.changeAmount = (parseFloat(stock.changeAmount) * -1).toFixed(2);
                if (newStock.changeAmount > 0) newStock.changeAmount = '+' + newStock.changeAmount;
                
                return newStock;
            }).sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent));
        } else if (type === 'volume') {
            // 成交量榜
            return stocks.sort((a, b) => parseInt(b.volume) - parseInt(a.volume));
        } else if (type === 'turnover') {
            // 换手率榜
            return stocks.sort((a, b) => parseFloat(b.turnoverRate) - parseFloat(a.turnoverRate));
        }
        
        return stocks;
    }
};