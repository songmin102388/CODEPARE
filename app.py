from datetime import datetime
from zoneinfo import ZoneInfo
from flask import Flask, render_template,jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def main():
    return render_template("index.html")


@socketio.on("signal")
def handle_signal(data):
    print("받은 데이터 : ", data)
    emit("signal", data, broadcast=True, include_self=False)


@app.get("/api/time")  
def get_time():       
    now = datetime.now(ZoneInfo("Asia/Seoul"))
    return jsonify({
        "human": now.strftime("%Y-%m-%d %H:%M:%S"),
        "iso": now.isoformat(),
        "unix": int(now.timestamp())
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090, debug=True)

