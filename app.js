let express = require('express')
var router = express.Router();
let request = require('request') // "Request" library
let querystring = require('querystring')
let cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')
const ENV         = process.env.ENV || "development";
const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

require('dotenv').config()

let app = express()
app.set('view engine', 'ejs');


let PORT = process.env.PORT || 8080


let client_id = process.env.clientID // Your client id
let client_secret = process.env.clientSecret; // Your secret
let redirect_uri = `https://spotifytuner.herokuapp.com/spotify/callback` // Your redirect uri
let app_uri = `https://spotifytuner.herokuapp.com`

app.use(express.static(__dirname + '/public'))
.use(cookieParser());

const cors = require('cors');
app.use(cors());
app.options('*', cors());


// var allowCrossDomain = function(req, res, next) {
//   res.Header('Access-Control-Allow-Origin', "http://spotifytuner.herokuapp.com");
//  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//  res.header('Access-Control-Allow-Headers', 'Content-Type');
//  res.header('Access-Control-Allow-Credentials', true);
//  next();
// }
// app.use(allowCrossDomain)

app.use(morgan('dev'));

app.use(cookieSession({
  name: 'session',
  keys: ['userId']
}))
app.set('trust proxy', 1) // trust first proxy

const DataHelpers = require("./lib/data-helpers.js")(knex);


const spotifyRoutes = require("./routes/spotify");
const userRoutes = require("./routes/users");
const trackRoutes = require("./routes/tracks");
const artistRoutes = require("./routes/artists");

const absArtistRoutes = require("./routes/absArtists");

app.use("/spotify", spotifyRoutes(DataHelpers));
app.use("/users", userRoutes(DataHelpers));
app.use("/tracks", trackRoutes(DataHelpers));
app.use("/artists", artistRoutes(DataHelpers));

app.use("/absArtists", absArtistRoutes(DataHelpers))

app.listen(PORT, () => { //listen on the port 8080 and let node know server started running
  console.log(`Example listening on port ${PORT}`);
});








const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');
const messageParse = require('./active-server/messageParse.js')
const db = require('./active-server/ActivePlaylistsDB.js')

const server = express()
.use((req, res) => res.sendFile(INDEX) )
.listen(8080, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });
const sendUpdate = (callback) => {
  db.updateRoomData(sockets, callback)
}

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
