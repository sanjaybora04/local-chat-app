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
  useEffect(() => {
    document.getElementById('messages').scrollTo(0, document.getElementById('messages').scrollHeight)
  }, [messages,message])

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
      <div className='w-screen h-[calc(100dvh)]'>
        <div id='messages' className='w-full flex h-full overflow-scroll'>
          <div className='w-full mt-auto'>
            <div className='px-5'>
              {messages.map((_message,index) => {
                if (_message.sender.id == user.id) {
                  return <div key={index} className='w-full text-right'>Me(To {_message.reciever.id ? _message.reciever.name : "Everyone"}):{_message.content}</div>
                } else {
                  return <div key={index} className='w-full text-left'>{_message.sender.name}({_message.reciever.id == user.id ? "To me" : "To Everyone"}):{_message.content}</div>
                }
              })}
            </div>

            <div className='flex w-full p-3'>
              <select defaultValue={reciever.id} onChange={e => setReciever(connections.find(connection => connection.id == e.target.value))} className='p-2 rounded-l-lg bg-neutral-400'>
                <option value=''>To EveryOne</option>
                {
                  connections.map((connection => {
                    if (connection.id != user.id) {
                      return <option key={connection.id} value={connection.id}>To {connection.name}</option>
                    }
                  }))
                }
              </select>
              <input type='text' value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { e.key == 'Enter' ? sendMessage() : null }} className='w-full p-2'></input>
              <button className='p-2 rounded-r-lg bg-green-700 text-white' onClick={e => sendMessage()}>Send</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App
