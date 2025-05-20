/**
 * A股行情查看器 - 走势对比模块
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化走势对比功能
    CompareApp.init();
});

// 走势对比应用对象
const CompareApp = {
    // 当前选择的股票列表
    selectedStocks: [],
    
    // 当前选择的对比周期（天数）
    period: 7,
    
    // 当前选择的对比方式（percent: 涨跌幅, price: 价格）
    method: 'percent',
    
    // 股票数据缓存
    stockDataCache: {},
    
    // 颜色列表（用于图表中区分不同股票）
    colors: ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#607d8b', '#e91e63', '#00bcd4'],
    
    // 初始化应用
    init() {
        // 从本地存储加载已选择的股票
        this.loadSelectedStocks();
        
        // 初始化事件监听
        this.initEventListeners();
        
        // 更新股票显示
        this.updateStocksDisplay();
        
        // 如果有选择的股票，加载对比数据
        if (this.selectedStocks.length > 0) {
            this.loadCompareData();
        }
    },
    
    // 初始化事件监听
    initEventListeners() {
        // 添加股票按钮点击事件
        const addStockBtn = document.getElementById('add-compare-stock-btn');
        if (addStockBtn) {
            addStockBtn.addEventListener('click', () => {
                const stockInput = document.getElementById('compare-stock-input');
                const stockCode = stockInput.value.trim();
                
                if (stockCode) {
                    this.addStock(stockCode);
                    stockInput.value = '';
                }
            });
        }
        
        // 股票输入框回车事件
        const stockInput = document.getElementById('compare-stock-input');
        if (stockInput) {
            stockInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const stockCode = stockInput.value.trim();
                    
                    if (stockCode) {
                        this.addStock(stockCode);
                        stockInput.value = '';
                    }
                }
            });
        }
        
        // 对比周期选择事件
        const periodRadios = document.querySelectorAll('input[name="compare-period"]');
        periodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.period = parseInt(radio.value);
                    this.loadCompareData();
                }
            });
        });
        
        // 对比方式选择事件
        const methodRadios = document.querySelectorAll('input[name="compare-method"]');
        methodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.method = radio.value;
                    this.loadCompareData();
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
    
    // 添加股票
    async addStock(stockCode) {
        try {
            // 检查是否已经添加
            if (this.selectedStocks.some(stock => stock.code === stockCode)) {
                alert('该股票已添加');
                return;
            }
            
            // 限制最多添加8只股票
            if (this.selectedStocks.length >= 8) {
                alert('最多只能添加8只股票进行对比');
                return;
            }
            
            // 获取股票信息
            const stockInfo = await this.getStockInfo(stockCode);
            
            // 添加到选择列表
            this.selectedStocks.push({
                code: stockCode,
                name: stockInfo.name,
                color: this.colors[this.selectedStocks.length % this.colors.length]
            });
            
            // 保存到本地存储
            this.saveSelectedStocks();
            
            // 更新股票显示
            this.updateStocksDisplay();
            
            // 加载对比数据
            this.loadCompareData();
        } catch (error) {
            console.error('添加股票失败:', error);
            alert('添加股票失败，请检查股票代码是否正确');
        }
    },
    
    // 移除股票
    removeStock(stockCode) {
        // 从列表中移除
        this.selectedStocks = this.selectedStocks.filter(stock => stock.code !== stockCode);
        
        // 保存到本地存储
        this.saveSelectedStocks();
        
        // 更新股票显示
        this.updateStocksDisplay();
        
        // 如果还有股票，重新加载对比数据
        if (this.selectedStocks.length > 0) {
            this.loadCompareData();
        } else {
            // 如果没有股票了，显示提示信息
            document.getElementById('compare-placeholder').style.display = 'block';
            document.getElementById('compare-analysis').innerHTML = '<p class="text-muted">添加股票后将显示对比分析</p>';
        }
    },
    
    // 更新股票显示
    updateStocksDisplay() {
        const container = document.getElementById('compare-stocks-container');
        if (!container) return;
        
        // 清空容器
        container.innerHTML = '';
        
        // 如果没有选择的股票，显示提示信息
        if (this.selectedStocks.length === 0) {
            container.innerHTML = '<p class="text-muted">请添加股票进行对比</p>';
            return;
        }
        
        // 创建股票标签
        this.selectedStocks.forEach(stock => {
            const stockItem = document.createElement('div');
            stockItem.className = 'compare-stock-item';
            stockItem.style.backgroundColor = stock.color + '20'; // 添加透明度
            stockItem.style.borderLeft = `3px solid ${stock.color}`;
            
            stockItem.innerHTML = `
                <span class="compare-stock-name">${stock.name} (${stock.code})</span>
                <span class="compare-stock-remove" data-code="${stock.code}">&times;</span>
            `;
            
            // 添加删除按钮点击事件
            const removeBtn = stockItem.querySelector('.compare-stock-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.removeStock(stock.code);
                });
            }
            
            container.appendChild(stockItem);
        });
    },
    
    // 加载对比数据
    async loadCompareData() {
        try {
            // 如果没有选择的股票，不加载数据
            if (this.selectedStocks.length === 0) {
                return;
            }
            
            // 隐藏提示信息
            document.getElementById('compare-placeholder').style.display = 'none';
            
            // 显示加载中状态
            this.showLoading();
            
            // 获取每只股票的K线数据
            const stockDataList = [];
            for (const stock of this.selectedStocks) {
                const kLineData = await this.getStockKLineData(stock.code, this.period);
                stockDataList.push({
                    code: stock.code,
                    name: stock.name,
                    color: stock.color,
                    data: kLineData
                });
            }
            
            // 绘制对比图表
            this.drawCompareChart(stockDataList);
            
            // 生成对比分析
            this.generateCompareAnalysis(stockDataList);
            
            // 隐藏加载中状态
            this.hideLoading();
        } catch (error) {
            console.error('加载对比数据失败:', error);
            this.hideLoading();
            alert('加载对比数据失败，请重试');
        }
    },
    
    // 绘制对比图表
    drawCompareChart(stockDataList) {
        // 获取图表容器
        const chartContainer = document.getElementById('compare-chart-container');
        if (!chartContainer) return;
        
        // 初始化图表
        const chart = echarts.init(chartContainer);
        
        // 处理数据
        const dates = stockDataList[0].data.map(item => item.date);
        
        // 根据对比方式处理数据
        let series = [];
        if (this.method === 'percent') {
            // 涨跌幅对比
            series = stockDataList.map(stockData => {
                const basePrice = stockData.data[0].close;
                const normalizedData = stockData.data.map(item => {
                    // 计算相对于基准价格的涨跌幅
                    return ((item.close - basePrice) / basePrice * 100).toFixed(2);
                });
                
                return {
                    name: stockData.name,
                    type: 'line',
                    data: normalizedData,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        color: stockData.color
                    },
                    itemStyle: {
                        color: stockData.color
                    }
                };
            });
        } else {
            // 价格对比
            series = stockDataList.map(stockData => {
                const priceData = stockData.data.map(item => item.close);
                
                return {
                    name: stockData.name,
                    type: 'line',
                    data: priceData,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        color: stockData.color
                    },
                    itemStyle: {
                        color: stockData.color
                    }
                };
            });
        }
        
        // 设置图表选项
        const option = {
            title: {
                text: '股票走势对比',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    let result = params[0].axisValue + '<br/>';
                    params.forEach(param => {
                        const marker = `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;
                        const value = this.method === 'percent' ? param.value + '%' : param.value;
                        result += marker + param.seriesName + ': ' + value + '<br/>';
                    });
                    return result;
                }
            },
            legend: {
                data: stockDataList.map(item => item.name),
                top: 30
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
                boundaryGap: false
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: this.method === 'percent' ? '{value}%' : '{value}'
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    show: true,
                    type: 'slider',
                    bottom: 10,
                    start: 0,
                    end: 100
                }
            ],
            series: series
        };
        
        // 设置图表选项并渲染
        chart.setOption(option);
        
        // 监听窗口大小变化，调整图表大小
        window.addEventListener('resize', () => {
            chart.resize();
        });
    },
    
    // 生成对比分析
    generateCompareAnalysis(stockDataList) {
        const analysisContainer = document.getElementById('compare-analysis');
        if (!analysisContainer) return;
        
        // 计算每只股票的涨跌幅
        const analysis = stockDataList.map(stockData => {
            const firstPrice = stockData.data[0].close;
            const lastPrice = stockData.data[stockData.data.length - 1].close;
            const changePercent = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
            const changeClass = parseFloat(changePercent) > 0 ? 'stock-up' : 
                              (parseFloat(changePercent) < 0 ? 'stock-down' : 'stock-unchanged');
            
            // 计算最大涨幅和最大跌幅
            let maxRise = 0;
            let maxFall = 0;
            
            for (let i = 1; i < stockData.data.length; i++) {
                const prevClose = stockData.data[i - 1].close;
                const currClose = stockData.data[i].close;
                const dayChange = (currClose - prevClose) / prevClose * 100;
                
                if (dayChange > maxRise) {
                    maxRise = dayChange;
                }
                
                if (dayChange < maxFall) {
                    maxFall = dayChange;
                }
            }
            
            return {
                code: stockData.code,
                name: stockData.name,
                color: stockData.color,
                firstPrice: firstPrice.toFixed(2),
                lastPrice: lastPrice.toFixed(2),
                changePercent: changePercent,
                changeClass: changeClass,
                maxRise: maxRise.toFixed(2),
                maxFall: maxFall.toFixed(2)
            };
        });
        
        // 按涨跌幅排序
        analysis.sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent));
        
        // 生成HTML
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>股票</th>
                            <th>期初价</th>
                            <th>期末价</th>
                            <th>涨跌幅</th>
                            <th>单日最大涨幅</th>
                            <th>单日最大跌幅</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        analysis.forEach((item, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>
                        ${item.name} (${item.code})
                    </td>
                    <td>${item.firstPrice}</td>
                    <td>${item.lastPrice}</td>
                    <td class="${item.changeClass}">${item.changePercent}%</td>
                    <td class="stock-up">${item.maxRise}%</td>
                    <td class="stock-down">${item.maxFall}%</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="mt-3">
                <h6>分析结论</h6>
                <p>在所选${this.period}天周期内：</p>
                <ul>
        `;
        
        // 添加分析结论
        if (analysis.length > 0) {
            // 表现最好的股票
            const bestStock = analysis[0];
            html += `<li>表现最好的是 <strong>${bestStock.name}</strong>，涨幅为 <span class="${bestStock.changeClass}">${bestStock.changePercent}%</span></li>`;
            
            // 表现最差的股票
            const worstStock = analysis[analysis.length - 1];
            html += `<li>表现最差的是 <strong>${worstStock.name}</strong>，涨幅为 <span class="${worstStock.changeClass}">${worstStock.changePercent}%</span></li>`;
            
            // 计算平均涨跌幅
            const avgChange = analysis.reduce((sum, item) => sum + parseFloat(item.changePercent), 0) / analysis.length;
            const avgChangeClass = avgChange > 0 ? 'stock-up' : (avgChange < 0 ? 'stock-down' : 'stock-unchanged');
            html += `<li>平均涨跌幅为 <span class="${avgChangeClass}">${avgChange.toFixed(2)}%</span></li>`;
            
            // 上涨股票数量
            const riseCount = analysis.filter(item => parseFloat(item.changePercent) > 0).length;
            html += `<li>上涨股票数量：${riseCount}只，下跌股票数量：${analysis.length - riseCount}只</li>`;
        }
        
        html += `
                </ul>
            </div>
        `;
        
        // 更新分析内容
        analysisContainer.innerHTML = html;
    },
    
    // 搜索股票
    async searchStock(keyword) {
        try {
            const results = await StockAPI.searchStock(keyword);
            
            if (results.length === 0) {
                alert('未找到匹配的股票');
                return;
            }
            
            // 如果只有一个结果，直接添加
            if (results.length === 1) {
                this.addStock(results[0].code);
                return;
            }
            
            // 如果有多个结果，显示选择列表
            // TODO: 实现搜索结果选择列表
            this.addStock(results[0].code);
        } catch (error) {
            console.error('搜索股票失败:', error);
            alert('搜索失败，请重试');
        }
    },
    
    // 获取股票信息
    async getStockInfo(code) {
        // 尝试从缓存获取
        if (this.stockDataCache[code] && this.stockDataCache[code].info) {
            return this.stockDataCache[code].info;
        }
        
        // 从API获取
        const stockInfo = await StockAPI.getStockDetail(code);
        
        // 保存到缓存
        if (!this.stockDataCache[code]) {
            this.stockDataCache[code] = {};
        }
        this.stockDataCache[code].info = stockInfo;
        
        return stockInfo;
    },
    
    // 获取股票K线数据
    async getStockKLineData(code, days) {
        // 尝试从缓存获取
        const cacheKey = `${code}_${days}`;
        if (this.stockDataCache[cacheKey] && this.stockDataCache[cacheKey].kLine) {
            return this.stockDataCache[cacheKey].kLine;
        }
        
        // 从API获取
        const kLineData = await StockAPI.getKLineData(code, 'daily', days);
        
        // 保存到缓存
        this.stockDataCache[cacheKey] = {
            kLine: kLineData
        };
        
        return kLineData;
    },
    
    // 从本地存储加载已选择的股票
    loadSelectedStocks() {
        const selectedStocksStr = localStorage.getItem('a-stock-compare-stocks');
        if (selectedStocksStr) {
            try {
                this.selectedStocks = JSON.parse(selectedStocksStr);
                
                // 确保每个股票都有颜色
                this.selectedStocks.forEach((stock, index) => {
                    if (!stock.color) {
                        stock.color = this.colors[index % this.colors.length];
                    }
                });
            } catch (error) {
                console.error('解析已选择的股票失败:', error);
                this.selectedStocks = [];
            }
        } else {
            // 默认添加一些示例股票
            this.selectedStocks = [
                { code: 'sh000001', name: '上证指数', color: this.colors[0] },
                { code: 'sz399001', name: '深证成指', color: this.colors[1] }
            ];
        }
    },
    
    // 保存已选择的股票到本地存储
    saveSelectedStocks() {
        localStorage.setItem('a-stock-compare-stocks', JSON.stringify(this.selectedStocks));
    },
    
    // 显示加载中状态
    showLoading() {
        // TODO: 实现加载中状态显示
    },
    
    // 隐藏加载中状态
    hideLoading() {
        // TODO: 实现加载中状态隐藏
    }
};