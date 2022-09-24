import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import {BiExit} from 'react-icons/bi'
import {BsMicMute, BsCamera} from 'react-icons/bs'
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"


const socket = io.connect('https://talkup-chat.herokuapp.com/')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		window.location.reload(true);
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>TalkUp</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay />:
					null}
				</div>
			</div>
			{!receivingCall && 
						<div className="myId">
						<div className="idChild">
						<TextField
							id="filled-basic"
							label="Name"
							variant="filled"
							value={name}
							style={{marginBottom: 15}}
							onChange={(e) => setName(e.target.value)}
						/>
						<CopyToClipboard text={me}>
							<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
								Copy ID
							</Button>
						</CopyToClipboard>
						</div>
						
						<div className="idChild">
						<TextField
							id="filled-basic"
							label="ID to call"
							variant="filled"	
							value={idToCall}
							style={{marginBottom: 15}}
							onChange={(e) => setIdToCall(e.target.value)}
						/>
							{callAccepted && !callEnded ? (
								<Button variant="contained" color="secondary" onClick={leaveCall}>
									End Call
								</Button>
							) : (
								<Button variant="contained" color="primary" onClick={() => callUser(idToCall)}>
									Call ID
								</Button>
							)}
						</div>
					</div>}			
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
			{callAccepted && !callEnded &&
			<div className="activeCall">
				<BsCamera className="icons"/>
				<BsMicMute className="icons"/>
				<BiExit onClick={leaveCall} className="icons"/>
			</div>
			}
		</div>
		</>
	)
}

export default App
