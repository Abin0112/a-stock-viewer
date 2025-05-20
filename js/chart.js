/**
 * A股行情查看器 - 图表处理模块
 * 
 * 使用ECharts库绘制各种股票图表
 */

const ChartManager = {
    // 存储图表实例
    charts: {},
    
    // 初始化图表
    initChart(containerId) {
        // 如果已经初始化过，先销毁
        if (this.charts[containerId]) {
            this.charts[containerId].dispose();
        }
        
        // 获取容器元素
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`图表容器 ${containerId} 不存在`);
            return null;
        }
        
        // 初始化ECharts实例
        const chart = echarts.init(container);
        this.charts[containerId] = chart;
        
        // 监听窗口大小变化，调整图表大小
        window.addEventListener('resize', () => {
            chart.resize();
        });
        
        return chart;
    },
    
    // 绘制K线图
    drawKLineChart(containerId, data, title = '') {
        const chart = this.initChart(containerId);
        if (!chart) return;
        
        // 处理数据格式
        const categoryData = data.map(item => item.date);
        const values = data.map(item => [item.open, item.close, item.low, item.high]);
        const volumes = data.map(item => item.volume);
        
        // 计算MA5和MA10
        const ma5 = this.calculateMA(5, data);
        const ma10 = this.calculateMA(10, data);
        const ma20 = this.calculateMA(20, data);
        
        // 设置图表选项
        const option = {
            title: {
                text: title,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                formatter: function (params) {
                    const data = params[0].data;
                    return [
                        '日期: ' + params[0].axisValue,
                        '开盘价: ' + data[0],
                        '收盘价: ' + data[1],
                        '最低价: ' + data[2],
                        '最高价: ' + data[3]
                    ].join('<br>');
                }
            },
            legend: {
                data: ['K线', 'MA5', 'MA10', 'MA20'],
                top: 30
            },
            grid: [
                {
                    left: '10%',
                    right: '10%',
                    top: '15%',
                    height: '60%'
                },
                {
                    left: '10%',
                    right: '10%',
                    top: '80%',
                    height: '15%'
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: categoryData,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false },
                    splitLine: { show: false },
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax'
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: categoryData,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax'
                }
            ],
            yAxis: [
                {
                    scale: true,
                    splitArea: {
                        show: true
                    }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLabel: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false }
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: 50,
                    end: 100
                },
                {
                    show: true,
                    xAxisIndex: [0, 1],
                    type: 'slider',
                    bottom: '5%',
                    start: 50,
                    end: 100
                }
            ],
            series: [
                {
                    name: 'K线',
                    type: 'candlestick',
                    data: values,
                    itemStyle: {
                        color: '#ef232a',
                        color0: '#14b143',
                        borderColor: '#ef232a',
                        borderColor0: '#14b143'
                    },
                    markPoint: {
                        label: {
                            formatter: function (param) {
                                return param != null ? Math.round(param.value) + '' : '';
                            }
                        },
                        data: [
                            {
                                name: '最高值',
                                type: 'max',
                                valueDim: 'highest'
                            },
                            {
                                name: '最低值',
                                type: 'min',
                                valueDim: 'lowest'
                            }
                        ],
                        tooltip: {
                            formatter: function (param) {
                                return param.name + '<br>' + (param.data.coord || '');
                            }
                        }
                    }
                },
                {
                    name: 'MA5',
                    type: 'line',
                    data: ma5,
                    smooth: true,
                    lineStyle: {
                        opacity: 0.5
                    }
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: ma10,
                    smooth: true,
                    lineStyle: {
                        opacity: 0.5
                    }
                },
                {
                    name: 'MA20',
                    type: 'line',
                    data: ma20,
                    smooth: true,
                    lineStyle: {
                        opacity: 0.5
                    }
                },
                {
                    name: '成交量',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: volumes,
                    itemStyle: {
                        color: function(params) {
                            const i = params.dataIndex;
                            return data[i].close > data[i].open ? '#ef232a' : '#14b143';
                        }
                    }
                }
            ]
        };
        
        // 设置图表选项并渲染
        chart.setOption(option);
        
        return chart;
    },
    
    // 绘制分时图
    drawTimeLineChart(containerId, data, title = '') {
        const chart = this.initChart(containerId);
        if (!chart) return;
        
        // 处理数据格式
        const times = data.map(item => item.time);
        const prices = data.map(item => item.price);
        const volumes = data.map(item => item.volume);
        
        // 计算均价
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const avgPrices = Array(prices.length).fill(avgPrice);
        
        // 设置图表选项
        const option = {
            title: {
                text: title,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                formatter: function (params) {
                    const priceParam = params.find(param => param.seriesName === '价格');
                    const volumeParam = params.find(param => param.seriesName === '成交量');
                    
                    if (!priceParam || !volumeParam) return '';
                    
                    return [
                        '时间: ' + priceParam.axisValue,
                        '价格: ' + priceParam.data,
                        '成交量: ' + volumeParam.data
                    ].join('<br>');
                }
            },
            legend: {
                data: ['价格', '均价', '成交量'],
                top: 30
            },
            grid: [
                {
                    left: '10%',
                    right: '10%',
                    top: '15%',
                    height: '60%'
                },
                {
                    left: '10%',
                    right: '10%',
                    top: '80%',
                    height: '15%'
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: times,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false },
                    splitLine: { show: false },
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax',
                    axisPointer: {
                        show: true
                    }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: times,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax'
                }
            ],
            yAxis: [
                {
                    scale: true,
                    splitArea: {
                        show: true
                    }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLabel: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false }
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: 0,
                    end: 100
                },
                {
                    show: true,
                    xAxisIndex: [0, 1],
                    type: 'slider',
                    bottom: '5%',
                    start: 0,
                    end: 100
                }
            ],
            series: [
                {
                    name: '价格',
                    type: 'line',
                    data: prices,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 2,
                        color: '#ff4d4f'
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            {
                                offset: 0,
                                color: 'rgba(255, 77, 79, 0.3)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(255, 77, 79, 0.1)'
                            }
                        ])
                    }
                },
                {
                    name: '均价',
                    type: 'line',
                    data: avgPrices,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 1,
                        type: 'dashed',
                        color: '#52c41a'
                    }
                },
                {
                    name: '成交量',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: volumes,
                    itemStyle: {
                        color: '#1890ff'
                    }
                }
            ]
        };
        
        // 设置图表选项并渲染
        chart.setOption(option);
        
        return chart;
    },
    
    // 绘制走势对比图
    drawCompareChart(containerId, dataList, title = '') {
        const chart = this.initChart(containerId);
        if (!chart) return;
        
        // 处理数据格式
        const dates = dataList[0].data.map(item => item.date);
        
        // 计算基准价格（第一天的收盘价）
        const series = dataList.map(stockData => {
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
                showSymbol: false
            };
        });
        
        // 设置图表选项
        const option = {
            title: {
                text: title,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    let result = params[0].axisValue + '<br/>';
                    params.forEach(param => {
                        result += param.marker + param.seriesName + ': ' + param.data + '%<br/>';
                    });
                    return result;
                }
            },
            legend: {
                data: dataList.map(item => item.name),
                top: 30
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '15%',
                bottom: '15%'
            },
            xAxis: {
                type: 'category',
                data: dates,
                boundaryGap: false
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '{value}%'
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
                    bottom: '5%',
                    start: 0,
                    end: 100
                }
            ],
            series: series
        };
        
        // 设置图表选项并渲染
        chart.setOption(option);
        
        return chart;
    },
    
    // 绘制大盘指数走势图
    drawMarketIndexChart(containerId, data, title = '') {
        const chart = this.initChart(containerId);
        if (!chart) return;
        
        // 处理数据格式
        const dates = data.map(item => item.date);
        const values = data.map(item => item.close);
        
        // 设置图表选项
        const option = {
            title: {
                text: title,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '15%',
                bottom: '15%'
            },
            xAxis: {
                type: 'category',
                data: dates,
                boundaryGap: false
            },
            yAxis: {
                type: 'value',
                scale: true,
                splitArea: {
                    show: true
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 50,
                    end: 100
                },
                {
                    show: true,
                    type: 'slider',
                    bottom: '5%',
                    start: 50,
                    end: 100
                }
            ],
            series: [
                {
                    name: title,
                    type: 'line',
                    data: values,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 2,
                        color: '#ff4d4f'
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            {
                                offset: 0,
                                color: 'rgba(255, 77, 79, 0.3)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(255, 77, 79, 0.1)'
                            }
                        ])
                    }
                }
            ]
        };
        
        // 设置图表选项并渲染
        chart.setOption(option);
        
        return chart;
    },
    
    // 绘制饼图（如行业分布）
    drawPieChart(containerId, data, title = '') {
        const chart = this.initChart(containerId);
        if (!chart) return;
        
        // 设置图表选项
        const option = {
            title: {
                text: title,
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'middle',
                data: data.map(item => item.name)
            },
            series: [
                {
                    name: title,
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
                    data: data
                }
            ]
        };
        
        // 设置图表选项并渲染
        chart.setOption(option);
        
        return chart;
    },
    
    // 计算移动平均线
    calculateMA(dayCount, data) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < dayCount - 1) {
                result.push('-');
                continue;
            }
            
            let sum = 0;
            for (let j = 0; j < dayCount; j++) {
                sum += data[i - j].close;
            }
            result.push((sum / dayCount).toFixed(2));
        }
        return result;
    }
};

// 导出图表管理器
window.ChartManager = ChartManager;