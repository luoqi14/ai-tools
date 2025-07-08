from app import create_app
import os

app = create_app()
 
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8003))
    
    # 检查是否启用HTTPS
    if os.environ.get('HTTPS') == 'true':
        ssl_cert = os.environ.get('SSL_CRT', '../192.168.100.123+2.pem')
        ssl_key = os.environ.get('SSL_KEY', '../192.168.100.123+2-key.pem')
        app.run(host='0.0.0.0', port=port, debug=True, ssl_context=(ssl_cert, ssl_key))
    else:
        app.run(host='0.0.0.0', port=port, debug=True) 