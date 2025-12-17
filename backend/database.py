import sqlite3
import os
from datetime import datetime

class Database:
    def __init__(self, db_path='data/markdown.db'):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 返回字典格式
        return conn
    
    def get_document(self, doc_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
        doc = cursor.fetchone()
        conn.close()
        return dict(doc) if doc else None
    
    def save_document(self, doc_id, content, title=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if title:
            cursor.execute('''
                UPDATE documents 
                SET content = ?, title = ?, updated_at = ?
                WHERE id = ?
            ''', (content, title, datetime.now().isoformat(), doc_id))
        else:
            cursor.execute('''
                UPDATE documents 
                SET content = ?, updated_at = ?
                WHERE id = ?
            ''', (content, datetime.now().isoformat(), doc_id))
        
        conn.commit()
        conn.close()
        return True
    
    def get_online_users(self, doc_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT socket_id, username, joined_at 
            FROM online_users 
            WHERE document_id = ?
            ORDER BY joined_at
        ''', (doc_id,))
        users = cursor.fetchall()
        conn.close()
        return [dict(user) for user in users]