#!/usr/bin/env python3
"""
A股行情查看器 - 简易HTTP服务器
在5001端口提供静态文件服务
"""

import http.server
import socketserver
import os
import sys

# 设置端口
PORT = 5001

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 如果请求的是目录或不存在的文件，返回index.html
        if self.path == '/' or not os.path.exists(os.path.join(os.getcwd(), self.path.lstrip('/'))):
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        # 添加CORS头，允许跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

def run_server():
    handler = MyHttpRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"服务器已启动，请访问: http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            sys.exit(0)

if __name__ == "__main__":
    run_server()