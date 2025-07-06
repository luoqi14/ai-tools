import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ai-tools-secret-key-2024'
    
    # AI图像生成API密钥
    FAL_KEY = os.environ.get('FAL_KEY')
    
    # CORS设置
    CORS_ORIGINS = ['http://localhost:3003', 'http://127.0.0.1:3003']
    
    # API前缀
    API_PREFIX = '/api'
    
    # 其他配置
    JSON_AS_ASCII = False
    JSONIFY_PRETTYPRINT_REGULAR = True

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 