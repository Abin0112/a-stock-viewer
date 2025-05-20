/**
 * A股行情查看器 - 主要逻辑模块
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    App.init();
});

// 应用主对象
const App = {
    // 当前选中的股票代码
    currentStockCode: null,
    
    // 自选股列表
    watchlist: [],
    
    // 初始化应用
    init() {
        // 从本地存储加载自选股列表
        this.loadWatchlist();
        
        // 初始化事件监听
        this.initEventListeners();
        
        // 加载初始数据
        this.loadInitialData();
    },
    
    // 初始化事件监听
    initEventListeners() {
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
        
        // 添加自选股按钮点击事件
        const addStockBtn = document.getElementById('add-stock-btn');
        if (addStockBtn) {
            addStockBtn.addEventListener('click', () => {
                const stockCode = document.getElementById('add-stock-input').value.trim();
                if (stockCode) {
                    this.addToWatchlist(stockCode);
                    document.getElementById('add-stock-input').value = '';
                }
            });
        }
        
        // 保存自选股按钮点击事件
        const saveSubscriptionsBtn = document.getElementById('save-subscriptions-btn');
        if (saveSubscriptionsBtn) {
            saveSubscriptionsBtn.addEventListener('click', () => {
                this.saveWatchlist();
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('subscribeModal'));
                if (modal) {
                    modal.hide();
                }
                // 刷新自选股列表
                this.loadWatchlistData();
            });
        }
        
        // 添加到自选股按钮点击事件（股票详情模态框中）
        const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
        if (addToWatchlistBtn) {
            addToWatchlistBtn.addEventListener('click', () => {
                if (this.currentStockCode) {
                    this.addToWatchlist(this.currentStockCode);
                    // 更新按钮状态
                    addToWatchlistBtn.textContent = '已添加到自选股';
                    addToWatchlistBtn.disabled = true;
                }
            });
        }
    },
    
    // 加载初始数据
    async loadInitialData() {
        try {
            // 显示加载中状态
            this.showLoading();
            
            // 并行加载多个数据
            await Promise.all([
                this.loadWatchlistData(),
                this.loadMarketIndices(),
                this.loadHotStocks(),
                this.loadNews()
            ]);
            
            // 隐藏加载中状态
            this.hideLoading();
        } catch (error) {
            console.error('加载初始数据失败:', error);
            this.showError('加载数据失败，请刷新页面重试');
        }
    },
    
    // 加载自选股列表数据
    async loadWatchlistData() {
        const watchlistBody = document.getElementById('watchlist-body');
        if (!watchlistBody) return;
        
        // 清空表格内容
        watchlistBody.innerHTML = '';
        
        // 如果没有自选股，显示提示信息
        if (this.watchlist.length === 0) {
            watchlistBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-3">
                        <p class="text-muted mb-0">暂无自选股，请点击"管理自选股"按钮添加</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // 加载每个自选股的数据
        for (const code of this.watchlist) {
            try {
                const stockData = await StockAPI.getStockDetail(code);
                
                // 创建表格行
                const row = document.createElement('tr');
                
                // 设置涨跌样式类
                const changeClass = parseFloat(stockData.change) > 0 ? 'stock-up' : 
                                   (parseFloat(stockData.change) < 0 ? 'stock-down' : 'stock-unchanged');
                
                // 设置行内容
                row.innerHTML = `
                    <td>${stockData.code}</td>
                    <td>${stockData.name}</td>
                    <td class="${changeClass}">${stockData.currentPrice}</td>
                    <td class="${changeClass}">${stockData.change}</td>
                    <td class="${changeClass}">${stockData.changeAmount}</td>
                    <td>${(stockData.volume / 100).toFixed(0)}</td>
                    <td>${(stockData.amount / 10000).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-stock-btn" data-code="${stockData.code}">
                            查看
                        </button>
                        <button class="btn btn-sm btn-outline-danger remove-stock-btn" data-code="${stockData.code}">
                            删除
                        </button>
                    </td>
                `;
                
                // 添加到表格
                watchlistBody.appendChild(row);
                
                // 添加查看按钮点击事件
                const viewBtn = row.querySelector('.view-stock-btn');
                if (viewBtn) {
                    viewBtn.addEventListener('click', () => {
                        this.viewStockDetail(stockData.code);
                    });
                }
                
                // 添加删除按钮点击事件
                const removeBtn = row.querySelector('.remove-stock-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        this.removeFromWatchlist(stockData.code);
                    });
                }
            } catch (error) {
                console.error(`加载股票 ${code} 数据失败:`, error);
            }
        }
        
        // 更新自选股管理模态框中的列表
        this.updateSubscribedStocksList();
    },
    
    // 加载大盘指数
    async loadMarketIndices() {
        const marketIndexList = document.getElementById('market-index-list');
        if (!marketIndexList) return;
        
        try {
            const indices = await StockAPI.getMarketIndices();
            
            // 清空列表
            marketIndexList.innerHTML = '';
            
            // 添加指数数据
            indices.forEach(index => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.innerHTML = `
                    <div class="market-index-item">
                        <div>
                            <div class="market-index-name">${index.name}</div>
                            <div class="text-muted small">${index.code}</div>
                        </div>
                        <div>
                            <div class="${index.changeClass}">${index.currentPrice}</div>
                            <div class="${index.changeClass} small">${index.change}</div>
                        </div>
                    </div>
                `;
                
                // 添加点击事件
                listItem.addEventListener('click', () => {
                    this.viewStockDetail(index.code);
                });
                
                marketIndexList.appendChild(listItem);
            });
        } catch (error) {
            console.error('加载大盘指数失败:', error);
            marketIndexList.innerHTML = '<li class="list-group-item text-center text-muted">加载失败，请刷新重试</li>';
        }
    },
    
    // 加载热门股票
    async loadHotStocks() {
        const hotStocksList = document.getElementById('hot-stocks-list');
        if (!hotStocksList) return;
        
        try {
            const hotStocks = await StockAPI.getHotStocks();
            
            // 清空列表
            hotStocksList.innerHTML = '';
            
            // 添加热门股票数据
            hotStocks.forEach(stock => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.innerHTML = `
                    <div class="hot-stock-item">
                        <div>
                            <div class="hot-stock-name">${stock.name}</div>
                            <div class="text-muted small">${stock.code}</div>
                        </div>
                        <div>
                            <div class="${stock.changeClass}">${stock.currentPrice}</div>
                            <div class="${stock.changeClass} small">${stock.change}</div>
                        </div>
                    </div>
                `;
                
                // 添加点击事件
                listItem.addEventListener('click', () => {
                    this.viewStockDetail(stock.code);
                });
                
                hotStocksList.appendChild(listItem);
            });
        } catch (error) {
            console.error('加载热门股票失败:', error);
            hotStocksList.innerHTML = '<li class="list-group-item text-center text-muted">加载失败，请刷新重试</li>';
        }
    },
    
    // 加载财经新闻
    async loadNews() {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;
        
        try {
            const news = await StockAPI.getNews(5);
            
            // 清空列表
            newsList.innerHTML = '';
            
            // 添加新闻数据
            news.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item news-item';
                listItem.innerHTML = `
                    <div class="news-title">${item.title}</div>
                    <div class="news-time">${item.source} · ${item.time}</div>
                `;
                
                newsList.appendChild(listItem);
            });
        } catch (error) {
            console.error('加载财经新闻失败:', error);
            newsList.innerHTML = '<li class="list-group-item text-center text-muted">加载失败，请刷新重试</li>';
        }
    },
    
    // 搜索股票
    async searchStock(keyword) {
        try {
            const results = await StockAPI.searchStock(keyword);
            
            if (results.length === 0) {
                this.showError('未找到匹配的股票');
                return;
            }
            
            // 如果只有一个结果，直接查看详情
            if (results.length === 1) {
                this.viewStockDetail(results[0].code);
                return;
            }
            
            // 如果有多个结果，显示选择列表
            // TODO: 实现搜索结果选择列表
            this.viewStockDetail(results[0].code);
        } catch (error) {
            console.error('搜索股票失败:', error);
            this.showError('搜索失败，请重试');
        }
    },
    
    // 查看股票详情
    async viewStockDetail(code) {
        try {
            // 保存当前股票代码
            this.currentStockCode = code;
            
            // 获取股票详情
            const stockData = await StockAPI.getStockDetail(code);
            
            // 更新股票信息区域
            const stockInfo = document.getElementById('stock-info');
            if (stockInfo) {
                // 设置涨跌样式类
                const changeClass = parseFloat(stockData.change) > 0 ? 'stock-up' : 
                                   (parseFloat(stockData.change) < 0 ? 'stock-down' : 'stock-unchanged');
                
                stockInfo.innerHTML = `
                    <div class="stock-info-header">
                        <div>
                            <span class="stock-name">${stockData.name}</span>
                            <span class="stock-code">${stockData.code}</span>
                        </div>
                        <div>
                            <span class="stock-price ${changeClass}">${stockData.currentPrice}</span>
                            <span class="stock-change ${changeClass}">${stockData.change} ${stockData.changeAmount}</span>
                        </div>
                    </div>
                    <div class="stock-data-grid">
                        <div class="stock-data-item">
                            <span class="stock-data-label">今开</span>
                            <span>${stockData.open}</span>
                        </div>
                        <div class="stock-data-item">
                            <span class="stock-data-label">昨收</span>
                            <span>${stockData.preClose}</span>
                        </div>
                        <div class="stock-data-item">
                            <span class="stock-data-label">最高</span>
                            <span>${stockData.high}</span>
                        </div>
                        <div class="stock-data-item">
                            <span class="stock-data-label">最低</span>
                            <span>${stockData.low}</span>
                        </div>
                        <div class="stock-data-item">
                            <span class="stock-data-label">成交量</span>
                            <span>${(stockData.volume / 100).toFixed(0)}手</span>
                        </div>
                        <div class="stock-data-item">
                            <span class="stock-data-label">成交额</span>
                            <span>${(stockData.amount / 10000).toFixed(2)}万元</span>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-primary" id="view-detail-btn">
                            查看更多详情
                        </button>
                    </div>
                `;
                
                // 添加查看更多详情按钮点击事件
                const viewDetailBtn = document.getElementById('view-detail-btn');
                if (viewDetailBtn) {
                    viewDetailBtn.addEventListener('click', () => {
                        this.showStockDetailModal(stockData);
                    });
                }
            }
            
            // 加载K线图数据并绘制图表
            const kLineData = await StockAPI.getKLineData(code);
            ChartManager.drawKLineChart('stock-chart', kLineData, `${stockData.name} (${stockData.code}) K线图`);
        } catch (error) {
            console.error('查看股票详情失败:', error);
            this.showError('加载股票详情失败，请重试');
        }
    },
    
    // 显示股票详情模态框
    async showStockDetailModal(stockData) {
        // 更新模态框标题
        const modalTitle = document.getElementById('stock-detail-title');
        if (modalTitle) {
            modalTitle.textContent = `${stockData.name} (${stockData.code})`;
        }
        
        // 更新股票基本信息
        const stockDetailInfo = document.getElementById('stock-detail-info');
        if (stockDetailInfo) {
            // 设置涨跌样式类
            const changeClass = parseFloat(stockData.change) > 0 ? 'stock-up' : 
                               (parseFloat(stockData.change) < 0 ? 'stock-down' : 'stock-unchanged');
            
            stockDetailInfo.innerHTML = `
                <div class="mb-3">
                    <div class="stock-price ${changeClass}">${stockData.currentPrice}</div>
                    <div class="stock-change ${changeClass}">${stockData.change} ${stockData.changeAmount}</div>
                </div>
                <div class="stock-data-grid">
                    <div class="stock-data-item">
                        <span class="stock-data-label">今开</span>
                        <span>${stockData.open}</span>
                    </div>
                    <div class="stock-data-item">
                        <span class="stock-data-label">昨收</span>
                        <span>${stockData.preClose}</span>
                    </div>
                    <div class="stock-data-item">
                        <span class="stock-data-label">最高</span>
                        <span>${stockData.high}</span>
                    </div>
                    <div class="stock-data-item">
                        <span class="stock-data-label">最低</span>
                        <span>${stockData.low}</span>
                    </div>
                    <div class="stock-data-item">
                        <span class="stock-data-label">成交量</span>
                        <span>${(stockData.volume / 100).toFixed(0)}手</span>
                    </div>
                    <div class="stock-data-item">
                        <span class="stock-data-label">成交额</span>
                        <span>${(stockData.amount / 10000).toFixed(2)}万元</span>
                    </div>
                </div>
            `;
        }
        
        // 更新添加到自选股按钮状态
        const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
        if (addToWatchlistBtn) {
            if (this.watchlist.includes(stockData.code)) {
                addToWatchlistBtn.textContent = '已添加到自选股';
                addToWatchlistBtn.disabled = true;
            } else {
                addToWatchlistBtn.textContent = '添加到自选股';
                addToWatchlistBtn.disabled = false;
            }
        }
        
        // 加载并绘制分时图
        const timeLineData = await StockAPI.getTimeLineData(stockData.code);
        ChartManager.drawTimeLineChart('stock-detail-chart', timeLineData, '分时图');
        
        // 加载并绘制K线图
        const kLineData = await StockAPI.getKLineData(stockData.code);
        ChartManager.drawKLineChart('k-line-chart', kLineData, 'K线图');
        
        // 加载并绘制分时图（切换标签页用）
        ChartManager.drawTimeLineChart('time-line-chart', timeLineData, '分时图');
        
        // 加载财务数据
        this.loadFinancialData(stockData.code);
        
        // 加载相关新闻
        this.loadStockNews(stockData.code);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('stockDetailModal'));
        modal.show();
    },
    
    // 加载股票财务数据
    async loadFinancialData(code) {
        const financialData = document.getElementById('financial-data');
        if (!financialData) return;
        
        try {
            const data = await StockAPI.getStockFinancialData(code);
            
            financialData.innerHTML = `
                <div class="card mb-3">
                    <div class="card-header">市值数据</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">总市值</div>
                                    <div>${data.marketValue.totalMarketValue}亿元</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">流通市值</div>
                                    <div>${data.marketValue.circulatingMarketValue}亿元</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header">交易数据</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">市盈率</div>
                                    <div>${data.tradingData.peRatio}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">市净率</div>
                                    <div>${data.tradingData.pbRatio}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">换手率</div>
                                    <div>${data.tradingData.turnoverRate}%</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">股息率</div>
                                    <div>${data.tradingData.dividend}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">最近财报数据</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">营收</div>
                                    <div>${data.financialReport.revenue}亿元</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">净利润</div>
                                    <div>${data.financialReport.netProfit}亿元</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">同比增长</div>
                                    <div>${data.financialReport.growthRate}%</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-2">
                                    <div class="text-muted small">净资产收益率</div>
                                    <div>${data.financialReport.roe}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('加载财务数据失败:', error);
            financialData.innerHTML = '<div class="alert alert-warning">加载财务数据失败，请重试</div>';
        }
    },
    
    // 加载股票相关新闻
    async loadStockNews(code) {
        const stockNews = document.getElementById('stock-news');
        if (!stockNews) return;
        
        try {
            const news = await StockAPI.getStockNews(code, 5);
            
            // 清空列表
            stockNews.innerHTML = '';
            
            if (news.length === 0) {
                stockNews.innerHTML = '<div class="alert alert-info">暂无相关新闻</div>';
                return;
            }
            
            // 创建新闻列表
            const newsList = document.createElement('div');
            newsList.className = 'list-group';
            
            // 添加新闻数据
            news.forEach(item => {
                const listItem = document.createElement('a');
                listItem.className = 'list-group-item list-group-item-action';
                listItem.href = '#';
                listItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${item.title}</h6>
                        <small>${item.time}</small>
                    </div>
                    <p class="mb-1 small">${item.summary}</p>
                    <small class="text-muted">${item.source}</small>
                `;
                
                newsList.appendChild(listItem);
            });
            
            stockNews.appendChild(newsList);
        } catch (error) {
            console.error('加载股票相关新闻失败:', error);
            stockNews.innerHTML = '<div class="alert alert-warning">加载新闻失败，请重试</div>';
        }
    },
    
    // 添加到自选股
    addToWatchlist(code) {
        // 检查是否已存在
        if (!this.watchlist.includes(code)) {
            this.watchlist.push(code);
            this.saveWatchlist();
            this.updateSubscribedStocksList();
        }
    },
    
    // 从自选股中移除
    removeFromWatchlist(code) {
        const index = this.watchlist.indexOf(code);
        if (index !== -1) {
            this.watchlist.splice(index, 1);
            this.saveWatchlist();
            this.loadWatchlistData();
        }
    },
    
    // 更新自选股管理模态框中的列表
    async updateSubscribedStocksList() {
        const subscribedStocksList = document.getElementById('subscribed-stocks-list');
        if (!subscribedStocksList) return;
        
        // 清空列表
        subscribedStocksList.innerHTML = '';
        
        // 如果没有自选股，显示提示信息
        if (this.watchlist.length === 0) {
            subscribedStocksList.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    暂无自选股，请添加
                </li>
            `;
            return;
        }
        
        // 加载每个自选股的数据
        for (const code of this.watchlist) {
            try {
                const stockData = await StockAPI.getStockDetail(code);
                
                // 创建列表项
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.innerHTML = `
                    <div>
                        <span>${stockData.name}</span>
                        <span class="text-muted small">${stockData.code}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-danger remove-subscribed-btn">
                        删除
                    </button>
                `;
                
                // 添加删除按钮点击事件
                const removeBtn = listItem.querySelector('.remove-subscribed-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        this.removeFromWatchlist(stockData.code);
                        listItem.remove();
                        
                        // 如果列表为空，显示提示信息
                        if (this.watchlist.length === 0) {
                            subscribedStocksList.innerHTML = `
                                <li class="list-group-item text-center text-muted">
                                    暂无自选股，请添加
                                </li>
                            `;
                        }
                    });
                }
                
                subscribedStocksList.appendChild(listItem);
            } catch (error) {
                console.error(`加载股票 ${code} 数据失败:`, error);
            }
        }
    },
    
    // 从本地存储加载自选股列表
    loadWatchlist() {
        const watchlistStr = localStorage.getItem('a-stock-watchlist');
        if (watchlistStr) {
            try {
                this.watchlist = JSON.parse(watchlistStr);
            } catch (error) {
                console.error('解析自选股列表失败:', error);
                this.watchlist = [];
            }
        } else {
            // 默认添加一些示例股票
            this.watchlist = ['sh600519', 'sh601318', 'sz000858', 'sz002594'];
        }
    },
    
    // 保存自选股列表到本地存储
    saveWatchlist() {
        localStorage.setItem('a-stock-watchlist', JSON.stringify(this.watchlist));
    },
    
    // 显示加载中状态
    showLoading() {
        // TODO: 实现加载中状态显示
    },
    
    // 隐藏加载中状态
    hideLoading() {
        // TODO: 实现加载中状态隐藏
    },
    
    // 显示错误信息
    showError(message) {
        alert(message);
    }
};