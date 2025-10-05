function updateClock() {
    const now = new Date();
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = daysOfWeek[now.getDay()];
    const month = (now.getMonth() + 1).toString().padStart(2, '');
    const day = now.getDate().toString().padStart(2, '');
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '');
    
    
    let ampm = 'AM';
    let displayHours = hours;
    
    if (hours >= 12) {
        ampm = 'PM';
        displayHours = hours % 12;
        if (displayHours === 0) {
        displayHours = 12;
        }
    }
    
    const dateString = `${month}월 ${day}일 ${dayOfWeek}요일`;
    const timeString = `${displayHours}:${minutes}`
    document.getElementById('date').textContent = dateString;
    document.getElementById('time').textContent = timeString;
}

// 매 초마다 시계 업데이트
setInterval(updateClock, 1000);
// 페이지 로드시에도 시계 업데이트
updateClock();


// ================= WebRTC 코드 =================//

// socket.io 서버 연결
const socket = io();

let pc = new RTCPeerConnection();


navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
    // local video 태그에 붙이기 * index.html에 localVideo 추가해야 한다
    const localVideo = document.createElement("video");
    localVideo.id = "localVideo";
    localVideo.autoplay = true;
    localVideo.muted = true;  // 자기 목소리 안 겹치게하는 역할임
    localVideo.playsInline = true;
    localVideo.style = "position:fixed; bottom:10px; left:10px; width:200px; border:2px solid red;";
    document.body.appendChild(localVideo);
    localVideo.srcObject = stream;

    // 스트림 트랙을 RTCPeerConnection에 추가합니다
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // offer 만들기 시작
    makeOffer();
})
.catch(err => {
    console.error("카메라/마이크 접근 실패:", err);
});

// ICE 서버로 전송
pc.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("signal", { ice: event.candidate });
    }
};

// 원격 스트림이 들어오면 remoteVideo에 붙인다
pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
    }
};


// 서버에서 signal 받기
socket.on("signal", async (data) => {
    console.log("서버에서 받은:", data);

    if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", { sdp: pc.localDescription});
        }
    }else if (data.ice){
        try {
            await pc.addIceCandidate(data.ice);
        } catch (err) {
            console.error("Ice 추가 실패", err)
        }
    }
});

// ICE 후보 서버로 전송
pc.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("signal", { ice: event.candidate });
    }
};

// 원격 스트림 들어오면 video에 붙이기
pc.ontrack = (event) => {
    const video = document.getElementById("remoteVideo");
    if (video) {
        video.srcObject = event.streams[0];
    }
};
