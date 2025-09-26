from flask import Flask, send_from_directory
from flask_cors import CORS
import subprocess
import threading
import os
import time

app = Flask(__name__)
CORS(app)

# Global variable to store the Node.js process
node_process = None

def start_node_server():
    """Start the Node.js server in a separate thread"""
    global node_process
    try:
        # Change to the server directory
        os.chdir('/home/ubuntu/rummy-tiles-game/server')
        
        # Start the Node.js server
        node_process = subprocess.Popen(['node', 'index.js'], 
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE)
        
        print("Node.js server started successfully")
        
        # Keep the process running
        node_process.wait()
        
    except Exception as e:
        print(f"Error starting Node.js server: {e}")

@app.route('/')
def index():
    return {
        "message": "Rummy Game Backend Server",
        "status": "running",
        "node_server": "active" if node_process and node_process.poll() is None else "inactive"
    }

@app.route('/health')
def health():
    return {
        "status": "healthy",
        "node_server": "running" if node_process and node_process.poll() is None else "stopped"
    }

if __name__ == '__main__':
    # Start Node.js server in a separate thread
    node_thread = threading.Thread(target=start_node_server, daemon=True)
    node_thread.start()
    
    # Give Node.js server time to start
    time.sleep(2)
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)
