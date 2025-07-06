from flask import jsonify

def success_response(data=None, message="操作成功"):
    """
    成功响应的统一格式
    """
    response = {
        'success': True,
        'message': message
    }
    if data is not None:
        response['data'] = data
    return jsonify(response)

def error_response(message="操作失败", code=400):
    """
    错误响应的统一格式
    """
    response = {
        'success': False,
        'message': message
    }
    return jsonify(response), code 