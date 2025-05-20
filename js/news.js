/**
 * A股行情查看器 - 财经新闻模块
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化财经新闻功能
    NewsApp.init();
});

// 财经新闻应用对象
const NewsApp = {
    // 当前选择的新闻分类
    currentCategory: 'all',
    
    // 当前页码
    currentPage: 1,
    
    // 每页显示的新闻数量
    pageSize: 10,
    
    // 总页数
    totalPages: 1,
    
    // 新闻数据缓存
    newsCache: {},
    
    // 初始化应用
    init() {
        // 初始化事件监听
        this.initEventListeners();
        
        // 加载新闻数据
        this.loadNewsData();
        
        // 加载侧边栏数据
        this.loadSidebarData();
    },
    
    // 初始化事件监听
    initEventListeners() {
        // 新闻分类选择事件
        const categoryRadios = document.querySelectorAll('input[name="news-category"]');
        categoryRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.currentCategory = radio.value;
                    this.currentPage = 1;
                    this.loadNewsList();
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
        
        // 查看相关股票按钮点击事件
        const viewRelatedStocksBtn = document.getElementById('view-related-stocks-btn');
        if (viewRelatedStocksBtn) {
            viewRelatedStocksBtn.addEventListener('click', () => {
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('newsDetailModal'));
                if (modal) {
                    modal.hide();
                }
                
                // 跳转到首页并显示相关股票
                // 这里简单处理，跳转到首页
                window.location.href = 'index.html';
            });
        }
    },
    
    // 加载新闻数据
    async loadNewsData() {
        try {
            // 加载新闻列表
            await this.loadNewsList();
        } catch (error) {
            console.error('加载新闻数据失败:', error);
            alert('加载新闻数据失败，请刷新页面重试');
        }
    },
    
    // 加载侧边栏数据
    async loadSidebarData() {
        try {
            // 并行加载多个数据
            await Promise.all([
                this.loadHotNews(),
                this.loadMarketIndices(),
                this.loadHotStocks()
            ]);
        } catch (error) {
            console.error('加载侧边栏数据失败:', error);
        }
    },
    
    // 加载新闻列表
    async loadNewsList() {
        const newsListContainer = document.getElementById('news-list');
        if (!newsListContainer) return;
        
        try {
            // 显示加载中状态
            newsListContainer.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            
            // 获取新闻数据
            const newsData = await this.getNewsList(this.currentCategory, this.currentPage, this.pageSize);
            
            // 更新总页数
            this.totalPages = Math.ceil(newsData.total / this.pageSize);
            
            // 清空容器
            newsListContainer.innerHTML = '';
            
            // 添加新闻列表
            if (newsData.list.length === 0) {
                newsListContainer.innerHTML = '<div class="alert alert-info">暂无新闻</div>';
            } else {
                const newsList = document.createElement('div');
                newsList.className = 'list-group';
                
                newsData.list.forEach(news => {
                    const newsItem = document.createElement('div');
                    newsItem.className = 'card mb-3 news-card';
                    newsItem.setAttribute('data-id', news.id);
                    
                    newsItem.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">${news.title}</h5>
                            <p class="card-text news-summary">${news.summary}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <span class="news-source">${news.source}</span> · 
                                    <span class="news-time">${news.time}</span>
                                </small>
                                <button class="btn btn-sm btn-outline-primary view-news-btn">
                                    查看详情
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // 添加查看详情按钮点击事件
                    const viewNewsBtn = newsItem.querySelector('.view-news-btn');
                    if (viewNewsBtn) {
                        viewNewsBtn.addEventListener('click', () => {
                            this.viewNewsDetail(news.id);
                        });
                    }
                    
                    // 添加新闻卡片点击事件
                    newsItem.addEventListener('click', (e) => {
                        // 如果点击的是按钮，不触发卡片点击事件
                        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                            this.viewNewsDetail(news.id);
                        }
                    });
                    
                    newsList.appendChild(newsItem);
                });
                
                newsListContainer.appendChild(newsList);
            }
            
            // 更新分页
            this.updatePagination();
        } catch (error) {
            console.error('加载新闻列表失败:', error);
            newsListContainer.innerHTML = '<div class="alert alert-danger">加载新闻列表失败，请刷新页面重试</div>';
        }
    },
    
    // 加载热门新闻
    async loadHotNews() {
        const hotNewsListContainer = document.getElementById('hot-news-list');
        if (!hotNewsListContainer) return;
        
        try {
            // 获取热门新闻数据
            const hotNews = await this.getHotNews();
            
            // 清空容器
            hotNewsListContainer.innerHTML = '';
            
            // 添加热门新闻列表
            if (hotNews.length === 0) {
                hotNewsListContainer.innerHTML = '<div class="alert alert-info">暂无热门新闻</div>';
            } else {
                const newsList = document.createElement('div');
                newsList.className = 'list-group';
                
                hotNews.forEach(news => {
                    const newsItem = document.createElement('a');
                    newsItem.className = 'list-group-item list-group-item-action';
                    newsItem.href = '#';
                    newsItem.setAttribute('data-id', news.id);
                    
                    newsItem.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${news.title}</h6>
                        </div>
                        <small class="text-muted">${news.source} · ${news.time}</small>
                    `;
                    
                    // 添加点击事件
                    newsItem.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.viewNewsDetail(news.id);
                    });
                    
                    newsList.appendChild(newsItem);
                });
                
                hotNewsListContainer.appendChild(newsList);
            }
        } catch (error) {
            console.error('加载热门新闻失败:', error);
            hotNewsListContainer.innerHTML = '<div class="alert alert-danger">加载热门新闻失败，请刷新页面重试</div>';
        }
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
                    window.location.href = `index.html?code=${index.code}`;
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
                    window.location.href = `index.html?code=${stock.code}`;
                });
                
                hotStocksList.appendChild(listItem);
            });
        } catch (error) {
            console.error('加载热门股票失败:', error);
            hotStocksList.innerHTML = '<li class="list-group-item text-center text-muted">加载失败，请刷新重试</li>';
        }
    },
    
    // 更新分页
    updatePagination() {
        const paginationContainer = document.getElementById('news-pagination');
        if (!paginationContainer) return;
        
        // 清空容器
        paginationContainer.innerHTML = '';
        
        // 如果总页数小于等于1，不显示分页
        if (this.totalPages <= 1) {
            return;
        }
        
        // 添加上一页按钮
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.setAttribute('aria-label', '上一页');
        prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
        
        prevItem.appendChild(prevLink);
        paginationContainer.appendChild(prevItem);
        
        // 添加页码按钮
        const maxPageButtons = 5; // 最多显示的页码按钮数
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(this.totalPages, startPage + maxPageButtons - 1);
        
        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            
            // 添加页码点击事件
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPage(i);
            });
            
            pageItem.appendChild(pageLink);
            paginationContainer.appendChild(pageItem);
        }
        
        // 添加下一页按钮
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}`;
        
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.setAttribute('aria-label', '下一页');
        nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
        
        // 添加上一页和下一页点击事件
        if (this.currentPage > 1) {
            prevLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPage(this.currentPage - 1);
            });
        }
        
        if (this.currentPage < this.totalPages) {
            nextLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPage(this.currentPage + 1);
            });
        }
        
        nextItem.appendChild(nextLink);
        paginationContainer.appendChild(nextItem);
    },
    
    // 跳转到指定页
    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }
        
        this.currentPage = page;
        this.loadNewsList();
        
        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    // 查看新闻详情
    async viewNewsDetail(newsId) {
        try {
            // 获取新闻详情
            const newsDetail = await this.getNewsDetail(newsId);
            
            // 更新模态框标题
            const modalTitle = document.getElementById('news-detail-title');
            if (modalTitle) {
                modalTitle.textContent = newsDetail.title;
            }
            
            // 更新模态框内容
            const modalContent = document.getElementById('news-detail-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="mb-3">
                        <small class="text-muted">
                            <span class="news-source">${newsDetail.source}</span> · 
                            <span class="news-time">${newsDetail.time}</span>
                        </small>
                    </div>
                    <div class="news-content">
                        ${newsDetail.content}
                    </div>
                    <hr>
                    <div class="mt-3">
                        <h6>相关股票</h6>
                        <div class="d-flex flex-wrap gap-2" id="related-stocks-container">
                            ${newsDetail.relatedStocks.map(stock => `
                                <a href="index.html?code=${stock.code}" class="btn btn-sm btn-outline-primary">
                                    ${stock.name} (${stock.code})
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('newsDetailModal'));
            modal.show();
        } catch (error) {
            console.error('查看新闻详情失败:', error);
            alert('加载新闻详情失败，请重试');
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
    
    // 获取新闻列表（模拟数据）
    async getNewsList(category, page, pageSize) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 缓存键
        const cacheKey = `${category}_${page}_${pageSize}`;
        
        // 如果有缓存，直接返回缓存数据
        if (this.newsCache[cacheKey]) {
            return this.newsCache[cacheKey];
        }
        
        // 模拟新闻数据
        const allNews = [];
        
        // 生成模拟新闻数据
        for (let i = 1; i <= 100; i++) {
            const newsCategory = i % 4 === 0 ? 'policy' : (i % 3 === 0 ? 'company' : 'market');
            
            allNews.push({
                id: `news-${i}`,
                title: `这是一条${category === 'all' ? '' : category + '类别的'}财经新闻标题 ${i}`,
                summary: '这是新闻摘要，简要介绍新闻的主要内容。实际项目中应该从新闻API获取真实数据。',
                content: `
                    <p>这是新闻正文第一段，详细介绍新闻的内容。实际项目中应该从新闻API获取真实数据。</p>
                    <p>这是新闻正文第二段，提供更多的细节和背景信息。</p>
                    <p>这是新闻正文第三段，可能包含引用、数据或其他相关信息。</p>
                    <p>这是新闻的结尾段落，总结新闻的主要观点或影响。</p>
                `,
                source: i % 3 === 0 ? '证券时报' : (i % 2 === 0 ? '上海证券报' : '中国证券报'),
                time: `2025-05-${20 - Math.floor(i / 5)} ${10 + (i % 12)}:${(i * 7) % 60}`,
                category: newsCategory,
                relatedStocks: [
                    { code: 'sh600519', name: '贵州茅台' },
                    { code: 'sh601318', name: '中国平安' },
                    { code: 'sz000858', name: '五粮液' }
                ]
            });
        }
        
        // 根据分类筛选
        let filteredNews = allNews;
        if (category !== 'all') {
            filteredNews = allNews.filter(news => news.category === category);
        }
        
        // 计算总数和分页
        const total = filteredNews.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pagedNews = filteredNews.slice(start, end);
        
        // 构造返回数据
        const result = {
            list: pagedNews,
            total: total,
            page: page,
            pageSize: pageSize
        };
        
        // 保存到缓存
        this.newsCache[cacheKey] = result;
        
        return result;
    },
    
    // 获取热门新闻（模拟数据）
    async getHotNews() {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 如果有缓存，直接返回缓存数据
        if (this.newsCache.hotNews) {
            return this.newsCache.hotNews;
        }
        
        // 模拟热门新闻数据
        const hotNews = [
            {
                id: 'hot-news-1',
                title: '央行定调下半年货币政策：保持流动性合理充裕',
                source: '证券时报',
                time: '2025-05-20 09:30'
            },
            {
                id: 'hot-news-2',
                title: '证监会：进一步提高上市公司质量',
                source: '上海证券报',
                time: '2025-05-20 10:15'
            },
            {
                id: 'hot-news-3',
                title: '两市成交额连续三日破万亿',
                source: '中国证券报',
                time: '2025-05-20 11:05'
            },
            {
                id: 'hot-news-4',
                title: '创业板注册制改革满一周年',
                source: '证券日报',
                time: '2025-05-19 16:30'
            },
            {
                id: 'hot-news-5',
                title: '银保监会：防范化解金融风险攻坚战取得重要阶段性成果',
                source: '金融时报',
                time: '2025-05-19 14:20'
            }
        ];
        
        // 保存到缓存
        this.newsCache.hotNews = hotNews;
        
        return hotNews;
    },
    
    // 获取新闻详情（模拟数据）
    async getNewsDetail(newsId) {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // 如果有缓存，直接返回缓存数据
        if (this.newsCache[newsId]) {
            return this.newsCache[newsId];
        }
        
        // 解析新闻ID
        const idParts = newsId.split('-');
        const newsType = idParts[0];
        const newsIndex = parseInt(idParts[1]);
        
        // 构造新闻详情
        let newsDetail;
        
        if (newsType === 'hot') {
            // 热门新闻
            const hotNews = await this.getHotNews();
            const news = hotNews.find(item => item.id === newsId);
            
            if (!news) {
                throw new Error('新闻不存在');
            }
            
            newsDetail = {
                id: news.id,
                title: news.title,
                content: `
                    <p>这是热门新闻"${news.title}"的详细内容。</p>
                    <p>这是新闻正文第一段，详细介绍新闻的内容。实际项目中应该从新闻API获取真实数据。</p>
                    <p>这是新闻正文第二段，提供更多的细节和背景信息。</p>
                    <p>这是新闻正文第三段，可能包含引用、数据或其他相关信息。</p>
                    <p>这是新闻的结尾段落，总结新闻的主要观点或影响。</p>
                `,
                source: news.source,
                time: news.time,
                relatedStocks: [
                    { code: 'sh600519', name: '贵州茅台' },
                    { code: 'sh601318', name: '中国平安' },
                    { code: 'sz000858', name: '五粮液' },
                    { code: 'sz002594', name: '比亚迪' }
                ]
            };
        } else {
            // 普通新闻
            newsDetail = {
                id: newsId,
                title: `这是一条财经新闻标题 ${newsIndex}`,
                content: `
                    <p>这是新闻正文第一段，详细介绍新闻的内容。实际项目中应该从新闻API获取真实数据。</p>
                    <p>这是新闻正文第二段，提供更多的细节和背景信息。</p>
                    <p>这是新闻正文第三段，可能包含引用、数据或其他相关信息。</p>
                    <p>这是新闻的结尾段落，总结新闻的主要观点或影响。</p>
                    <p>这是额外的段落，提供更多的分析和见解。</p>
                    <p>这是最后一段，可能包含对未来的展望或建议。</p>
                `,
                source: newsIndex % 3 === 0 ? '证券时报' : (newsIndex % 2 === 0 ? '上海证券报' : '中国证券报'),
                time: `2025-05-${20 - Math.floor(newsIndex / 5)} ${10 + (newsIndex % 12)}:${(newsIndex * 7) % 60}`,
                relatedStocks: [
                    { code: 'sh600519', name: '贵州茅台' },
                    { code: 'sh601318', name: '中国平安' },
                    { code: 'sz000858', name: '五粮液' },
                    { code: 'sz002594', name: '比亚迪' },
                    { code: 'sh600036', name: '招商银行' }
                ]
            };
        }
        
        // 保存到缓存
        this.newsCache[newsId] = newsDetail;
        
        return newsDetail;
    }
};