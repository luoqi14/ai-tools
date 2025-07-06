from flask import Flask
from flask_cors import CORS
from config import config

def create_app(config_name='default'):
    """
    创建Flask应用实例
    """
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 初始化CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # 注册蓝图
    from app.routes.main import main_bp
    from app.routes.tools import tools_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(tools_bp, url_prefix=app.config['API_PREFIX'])
    
    return app 