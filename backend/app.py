from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
import sqlite3
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # 允许跨域
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
socketio = SocketIO(app, cors_allowed_origins="*")

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'markdown.db')

# 初始化数据库
def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 文档表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            share_token TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 在线用户表（简化，不持久化）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            socket_id TEXT NOT NULL,
            document_id TEXT NOT NULL,
            username TEXT DEFAULT '匿名用户',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ 数据库初始化完成")

# API路由
@app.route('/')
def hello():
    return jsonify({"message": "Markdown Editor API", "status": "ok"})

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

# 创建文档
@app.route('/api/documents', methods=['POST'])
def create_document():
    data = request.json
    title = data.get('title', '新文档')
    content = data.get('content', '# 新文档')
    
    doc_id = str(uuid.uuid4())[:8]
    share_token = str(uuid.uuid4())[:12]
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO documents (id, title, content, share_token)
        VALUES (?, ?, ?, ?)
    ''', (doc_id, title, content, share_token))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": doc_id,
        "share_token": share_token,
        "message": "文档创建成功"
    }), 201

# 获取文档
@app.route('/api/documents/<doc_id>', methods=['GET'])
def get_document(doc_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, content, share_token, created_at, updated_at
        FROM documents WHERE id = ?
    ''', (doc_id,))
    
    doc = cursor.fetchone()
    conn.close()
    
    if not doc:
        return jsonify({"error": "文档不存在"}), 404
    
    return jsonify({
        "id": doc[0],
        "title": doc[1],
        "content": doc[2],
        "share_token": doc[3],
        "created_at": doc[4],
        "updated_at": doc[5]
    })

# 更新文档
@app.route('/api/documents/<doc_id>', methods=['PUT'])
def update_document(doc_id):
    data = request.json
    content = data.get('content', '')
    title = data.get('title')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if title:
        cursor.execute('''
            UPDATE documents 
            SET content = ?, title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (content, title, doc_id))
    else:
        cursor.execute('''
            UPDATE documents 
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (content, doc_id))
    
    conn.commit()
    
    # 更新后查询
    cursor.execute('SELECT content FROM documents WHERE id = ?', (doc_id,))
    updated_content = cursor.fetchone()[0]
    
    conn.close()
    
    # 广播更新给所有连接的客户端
    socketio.emit('document_updated', {
        'document_id': doc_id,
        'content': updated_content,
        'timestamp': datetime.now().isoformat()
    }, room=doc_id)
    
    return jsonify({
        "success": True,
        "message": "文档更新成功",
        "updated_at": datetime.now().isoformat()
    })

# 通过分享令牌获取文档
@app.route('/api/share/<token>', methods=['GET'])
def get_document_by_token(token):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, content, created_at, updated_at
        FROM documents WHERE share_token = ?
    ''', (token,))
    
    doc = cursor.fetchone()
    conn.close()
    
    if not doc:
        return jsonify({"error": "分享链接无效"}), 404
    
    return jsonify({
        "id": doc[0],
        "title": doc[1],
        "content": doc[2],
        "created_at": doc[3],
        "updated_at": doc[4]
    })

# 获取文档列表
@app.route('/api/documents', methods=['GET'])
def list_documents():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, created_at, updated_at
        FROM documents 
        ORDER BY updated_at DESC
        LIMIT 50
    ''')
    
    docs = cursor.fetchall()
    conn.close()
    
    documents = []
    for doc in docs:
        documents.append({
            "id": doc[0],
            "title": doc[1],
            "created_at": doc[2],
            "updated_at": doc[3]
        })
    
    return jsonify({
        "count": len(documents),
        "documents": documents
    })

# WebSocket事件处理
# 存储用户连接信息
connected_users = {}

@socketio.on('connect')
def handle_connect():
    """处理新连接"""
    try:
        document_id = request.args.get('documentId')
        username = request.args.get('username', '匿名用户')
        sid = request.sid
        
        print(f"✅ 新连接: {sid}, 用户: {username}, 文档: {document_id}")
        
        # 存储连接信息
        connected_users[sid] = {
            'username': username,
            'document_id': document_id
        }
        
        # 确认连接成功
        emit('connected', {'message': '连接成功'})
        
    except Exception as e:
        print(f"❌ 连接处理错误: {e}")
        # 确保发送响应
        try:
            emit('connect_error', {'error': str(e)})
        except:
            pass

@socketio.on('join-document')
def handle_join_document(data):
    """加入文档"""
    try:
        document_id = data.get('documentId')
        username = data.get('username')
        sid = request.sid
        
        print(f"👤 用户加入文档: {username}, 文档: {document_id}")
        
        # 更新用户信息
        if sid in connected_users:
            connected_users[sid]['document_id'] = document_id
            connected_users[sid]['username'] = username
        
        # 获取当前文档的所有用户
        document_users = []
        for user_sid, user_info in connected_users.items():
            if user_info.get('document_id') == document_id:
                document_users.append(user_info['username'])
        
        # 广播用户加入消息
        emit('user-joined', {
            'users': document_users,
            'newUser': username
        }, broadcast=True, include_self=True)
        
    except Exception as e:
        print(f"❌ 加入文档错误: {e}")

@socketio.on('leave-document')
def handle_leave_document(data):
    """离开文档"""
    try:
        document_id = data.get('documentId')
        username = data.get('username')
        sid = request.sid
        
        print(f"👋 用户离开文档: {username}, 文档: {document_id}")
        
        # 从connected_users中移除（在disconnect事件中也会处理）
        # 这里主要是为了提前处理主动离开的情况
        
    except Exception as e:
        print(f"❌ 离开文档错误: {e}")

@socketio.on('disconnect')
def handle_disconnect():
    """处理连接断开"""
    try:
        sid = request.sid
        
        if sid in connected_users:
            user_info = connected_users[sid]
            username = user_info.get('username')
            document_id = user_info.get('document_id')
            
            print(f"🔌 客户端断开: {sid}, 用户: {username}")
            
            # 从连接用户中移除
            del connected_users[sid]
            
            # 如果用户有加入文档，更新其他用户
            if document_id:
                # 获取当前文档的所有用户
                document_users = []
                for user_sid, info in connected_users.items():
                    if info.get('document_id') == document_id:
                        document_users.append(info['username'])
                
                # 广播用户离开消息
                emit('user-left', {
                    'users': document_users,
                    'leftUser': username
                }, broadcast=True, include_self=False)
                
    except Exception as e:
        print(f"❌ 断开连接处理错误: {e}")
        # 避免因为异常导致整个socketio服务崩溃
        pass

@socketio.on_error_default
def default_error_handler(e):
    """默认错误处理器"""
    print(f"⚠️ SocketIO错误: {e}")
    try:
        emit('error', {'error': str(e)})
    except:
        pass

if __name__ == '__main__':
    # 初始化数据库
    init_database()
    
    # 启动服务器
    print("🚀 启动 Markdown Editor 后端服务器...")
    print("📡 HTTP API: http://0.0.0.0:5004")
    print("📡 WebSocket: ws://0.0.0.0:5004")
    print("📁 数据库: data/markdown.db")
    
    socketio.run(app, 
                host='0.0.0.0', 
                port=5004, 
                debug=True, 
                allow_unsafe_werkzeug=True)