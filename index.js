const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express();

var httpsOptions = {
  key: null,
  cert: null
};

// httpsOptions.key = fs.readFileSync('/home/anonymous/Desktop/local_chat_app/cert/cert.key');
// httpsOptions.cert = fs.readFileSync('/home/anonymous/Desktop/local_chat_app/cert/cert.crt');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://192.168.240.197:5173",
    methods: ["GET", "POST"]
  }
});
app.use(cors());
app.use(express.static(path.join(__dirname, 'client/dist')));

// app.get('/', (req, res) => {
//   res.send('Welcome to the Attendance Portal!');
// });



let connections = []

/**
 * Check if username is unique or not
 */
const isUniqueUsername = (username) => {
  for (let i = 0; i < connections.length; i++) {
    if (connections[i].name == username) {
      return false;
    }
  }
  return true;
}

/**
 * Generate unique userName
 */
const usernameGenerator = () => {
  const name = 'user';
  let postfix = 1
  while (!isUniqueUsername(name + postfix)) {
    postfix++;
  }
  return (name + postfix);
}

/**
 * Update Users List
 */
const updateUsersList = () => {
  io.emit('updateUsersList', connections)
}

io.on('connection', (socket) => {
  console.log('A user connected');

  let name = usernameGenerator();

  connections = [...connections, { id: socket.id, name }]
  socket.emit("userdata", { id: socket.id, name })
  updateUsersList()

  socket.on('message', (message) => {
    if (message.reciever) {
      io.to(message.reciever.id).emit('message', { ...message, sender: {id:socket.id,name} })
      // socket.emit('message', { ...message, sender: {id:socket.id,name} })
    } else {
      io.emit('message', { ...message, sender: {id:socket.id,name} });
    }
  });

  socket.on('updateName', (newName) => {
    const connection = connections.find(connection => connection.id == socket.id)
    if (connection) {
      if (isUniqueUsername(newName)) {
        name = newName
        connection.name = newName;
        socket.emit('success', 'Name Updated')
        updateUsersList()
      }
      else {
        socket.emit('error', 'Name is already taken')
      }
    } else {
      socket.emit('error', 'Invalid request')
    }

  })

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    connections = connections.filter(connection => connection.id !== socket.id)
    updateUsersList()
  });
});

server.listen(5000, () => {
  console.log(`Server is running on port 5000`);
});
