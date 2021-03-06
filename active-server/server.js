const express = require('express');
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');
const messageParse = require('./messageParse.js')
const db = require('./ActivePlaylistsDB.js')

let sockets = {}

module.exports = (app, PORT) => {
  const server = app

  const sendUpdate = (callback) => {
    db.updateRoomData(sockets, callback)
  }

  const wss = new SocketServer({ server });
  wss.broadcast = function broadcast(data, reciever, type, error, ws, callback) {
    message = {
      reciever: reciever,
      type: type,
      data: data,
      error: error
    }
    wss.clients.forEach(function each(client){
      if(client.readyState === ws.OPEN){
        client.send(JSON.stringify(message))
      }
    })
    if(callback) {
      sockets[ws.id] = callback()
      sendUpdate(() => {
        messageParse({type: "getPlaylists"}, ws, wss.broadcast)
      })
    }
  }

  wss.on('connection', (ws) => {
    ws.id = uuidv1()
    console.log("Client Connected: ", ws.id)
    sockets[ws.id] = ws
    ws.on('message', (data) => {
    // console.log("recieved message")
    // console.log(data)
    messageParse(JSON.parse(data), sockets[ws.id], wss.broadcast)
  })
  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected id: ', ws.id)
    messageParse("leaveRoom", ws, wss.broadcast)
    delete sockets[ws.id]
    sendUpdate(() => {
      messageParse({type: "getPlaylists"}, ws, wss.broadcast)
    })
  });
});
}