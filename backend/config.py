import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ai-tools-secret-key-2024'
    
    # Black Forest Labs API密钥
    BFL_API_KEY = os.environ.get('BFL_API_KEY')
    
    # CORS设置 - 支持多种部署方式
    CORS_ORIGINS = [
        'http://localhost:3003',  # 本地开发
        'http://127.0.0.1:3003',  # 本地开发
        'http://localhost:3000',  # 备用端口
        'http://127.0.0.1:3000',  # 备用端口
        'http://192.168.100.123:3003',  # 备用端口
        'https://192.168.100.123:3003',  # 备用端口
    ]
    
    # 从环境变量添加额外的CORS域名
    extra_origins = os.environ.get('CORS_ORIGINS', '').split(',')
    for origin in extra_origins:
        origin = origin.strip()
        if origin:
            CORS_ORIGINS.append(origin)
    
    # API前缀
    API_PREFIX = '/api'
    
    # 其他配置
    JSON_AS_ASCII = False
    JSONIFY_PRETTYPRINT_REGULAR = True

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    
    # 生产环境CORS设置
    CORS_ORIGINS = Config.CORS_ORIGINS + [
        # 生产环境域名可以通过环境变量 CORS_ORIGINS 添加
        # 例如: CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
    ]

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 