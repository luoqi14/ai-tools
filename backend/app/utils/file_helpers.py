import os
import uuid
from werkzeug.utils import secure_filename

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    """
    检查文件扩展名是否允许
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """
    保存上传的文件到临时目录
    """
    if file and allowed_file(file.filename):
        # 生成唯一的文件名
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{uuid.uuid4().hex}{ext}"
        
        # 创建临时目录
        temp_dir = os.path.join(os.getcwd(), 'temp')
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        
        # 保存文件
        file_path = os.path.join(temp_dir, unique_filename)
        file.save(file_path)
        
        return file_path
    
    return None

def cleanup_temp_file(file_path):
    """
    清理临时文件
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass  # 忽略删除失败的情况 