import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_SERVER_URL)

const App = () => {
  const [user, setUser] = useState({ id: '', name: '' })
  const [connections, setConnections] = useState([])
  const [reciever, setReciever] = useState({ id: '', name: '' })

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    function userdata(data) {
      setUser(data)
    }

    function updateUsersList(_connections) {
      setConnections(_connections)
    }

    function message(_message) {
      if (_message.sender.id != user.id) {   // ignore your own broadcasted messages
        setMessages([...messages, _message])
      }
    }

    socket.on('userdata', userdata)
    socket.on('updateUsersList', updateUsersList)
    socket.on('message', message)
    return () => {
      socket.off('userdata', userdata)
      socket.off('updateUsersList', updateUsersList)
      socket.off('message', message)
    }
  })

  //ScrollToBottom
  useEffect(()=>{
    setTimeout(()=>{
      document.getElementById('messages').scrollTo(0,document.getElementById('messages').scrollHeight)
    },200)
  },[messages])

  const sendMessage = () => {
    socket.emit('message', { content: message, reciever })
    setMessages([...messages, { content: message, reciever, sender: user }])
    setMessage('')
  }

  return (
    <div className='bg-neutral-200'>
      <div className='fixed top-0 left-0 w-full text-center p-4 bg-white'>
        Username : {user.name}
      </div>
      <div className='w-screen h-screen p-14'>
        <div id='messages' className='w-full flex h-full px-5 overflow-scroll'>
          <div className='w-full mt-auto'>
            {messages.map((_message) => {
              if (_message.sender.id == user.id) {
                return <div className='w-full text-right'>Me(To {_message.reciever.id?_message.reciever.name:"Everyone"}):{_message.content}</div>
              } else {
                return <div className='w-full text-left'>{_message.sender.name}({_message.reciever.id == user.id ? "To me" : "To Everyone"}):{_message.content}</div>
              }
            })}
          </div>
        </div>
      </div>
      <div className='flex fixed bottom-0 left-0 w-full p-3'>
        <select defaultValue={reciever.id} onChange={e => setReciever(connections.find(connection => connection.id == e.target.value))} className='p-2 rounded-l-lg bg-neutral-400'>
          <option value=''>To EveryOne</option>
          {
            connections.map((connection => {
              if (connection.id != user.id) {
                return <option value={connection.id}>To {connection.name}</option>
              }
            }))
          }
        </select>
        <input type='text' value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { e.code == 'Enter' ? sendMessage() : null }} className='w-full p-2'></input>
        <button className='p-2 rounded-r-lg bg-green-700 text-white' onClick={e => sendMessage()}>Send</button>
      </div>
    </div>
  )
}

export default App
