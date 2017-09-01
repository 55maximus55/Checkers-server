var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var HashMap = require('hashmap');

var games = ["tictactoe", "checkers", "chess"]
var rooms = new HashMap()
var players = new HashMap()

// запуск сервера
server.listen(process.env.PORT, function(){
  console.log("CMS games server started");
});

//подключение игрока к серверу
io.on('connection', function(socket) {
    console.log("Player connected (" + socket.id + ")");
    socket.broadcast.emit('playerConnected', { id: socket.id });
    players.set(socket.id, new player());

    //отправка списка игр игроку
    socket.emit('gameList', games);
    //отправка списка комнат игроку
    var roomList = [];
    var i = 0;
    rooms.forEach(function(value, key) {
        roomList.push(new room(value.game, key));
        roomList[i].id = key;
        i++;
    });
    socket.emit('roomList', roomList);

    //создание комнаты
    socket.on('createRoom', function(data) {
        if (players.get(socket.id).room == "-1") {
            //проверка на существование игрового режима
            var g = false;
            for (var j = 0; j < games.length; j++) {
                if (data.game == games[j]) {
                    g = true;
                }
            }
            if (g) {
                //создание комнаты и сообщение об этом игрокам
                rooms.set(socket.id, new room(data.game, socket.id));
                players.get(socket.id).room = socket.id;
                socket.emit('createRoomSuccess', { roomID: socket.id });
                socket.broadcast.emit('createRoom', { roomID: socket.id, game: data.game });
                console.log("Created Room (" + socket.id + ", " + data.game + ")");
            }
            else {
                console.log("createRoomError (" + socket.id + "): invalid game name")
                socket.emit('createRoomError', { reason: "Invalid game name" });
            }
        }
        else {
            console.log("createRoomError (" + socket.id + "): player in room")
            socket.emit('createRoomError', { reason: "Leave another room before create another" });
        }
    });

    //вход в комнату
    socket.on('joinRoom', function(data) {
        if (players.get(socket.id).room != "-1") {
            var g = false;
            rooms.forEach(function (value, key) {
                if (data.roomID == key) {
                    g = true;
                }
            });
            if (g) {
                players.get(socket.id).room = data.roomID;
                rooms.get(data.roomID).players.push(socket.id);
                socket.emit('joinRoomSuccess', rooms.get(data.roomID).players);
                socket.broadcast.emit('joinRoom', { playerID: socket.id, roomID: data.roomID });
                console.log("Player (" + socket.id +") joined to room (" + data.roomID + ")");
            }
            else {
                socket.emit('joinRoomError', { reason: "404: room not found"});
            }
        }
        else {
            socket.emit('createRoomError', { reason: "Leave another room before join another" });
        }
    });

    //выход из комнаты
    socket.on('leaveRoom', function(data) {
        console.log("Player (" + socket.id + ") left from room " + players.get(socket.id).room);
        if (players.get(socket.id).room != "-1") {
            if (rooms.get(players.get(socket.id).room).players.length > 1) {
                if (rooms.get(players.get(socket.id).room).players[0] == socket.id) {
                    socket.broadcast.emit('changeRoomID', { oldID: socket.id, newID: rooms.get(players.get(socket.id).room).players[1] });

                    for (i = 1; i < rooms.get(players.get(socket.id).room).players.length; i++) {
                        players.get(rooms.get(players.get(socket.id).room).players[i]).room = rooms.get(players.get(socket.id).room).players[1];
                    }

                    rooms.get(players.get(socket.id).room).players.splice(0, 1);
                    rooms.set(players.get(socket.id).room, rooms.get(players.get(socket.id).room));
                    rooms.remove(socket.id);

                    players.get(socket.id).room = "-1";
                }
                else {
                    socket.broadcast.emit('leaveRoom', { roomID: players.get(socket.id).room, playerID: socket.id });
                    for (i = 1; i < rooms.get(players.get(socket.id).room).players.length; i++) {
                        if (rooms.get(players.get(socket.id).room).players[i] == socket.id) {
                            rooms.get(players.get(socket.id)).players.splice(i, 1);
                        }
                    }
                    players.get(socket.id).room = "-1";
                }
            }
            else {
                socket.emit('deleteRoom', { roomID: players.get(socket.id).room })
                socket.broadcast.emit('deleteRoom', { roomID: players.get(socket.id).room });
            }
        }
    });

    //ход игрока
    socket.on('playerMove', function(data) {

    });

    //отключение игрока от сервера
    socket.on('disconnect', function() {
        //оповещение об отключении
        console.log("Player disconnected (" + socket.id + ")");
        socket.broadcast.emit('playerDisconnected', { id: socket.id });
        if (players.get(socket.id).room != "-1") {
            if (rooms.get(players.get(socket.id).room).players.length > 1) {
                if (rooms.get(players.get(socket.id).room).players[0] == socket.id) {
                    socket.broadcast.emit('changeRoomID', { oldID: socket.id, newID: rooms.get(players.get(socket.id).room).players[1] });

                    for (i = 1; i < rooms.get(players.get(socket.id).room).players.length; i++) {
                        players.get(rooms.get(players.get(socket.id).room).players[i]).room = rooms.get(players.get(socket.id).room).players[1];
                    }

                    rooms.get(players.get(socket.id).room).players.splice(0, 1);
                    rooms.set(players.get(socket.id).room, rooms.get(players.get(socket.id).room));
                    rooms.remove(socket.id);

                    players.get(socket.id).room = "-1";
                }
                else {
                    socket.broadcast.emit('leaveRoom', { roomID: players.get(socket.id).room, playerID: socket.id });
                    for (i = 1; i < rooms.get(players.get(socket.id).room).players.length; i++) {
                        if (rooms.get(players.get(socket.id).room).players[i] == socket.id) {
                            rooms.get(players.get(socket.id)).players.splice(i, 1);
                        }
                    }
                    players.get(socket.id).room = "-1";
                }
            }
            else {
                socket.emit('deleteRoom', { roomID: players.get(socket.id).room })
                socket.broadcast.emit('deleteRoom', { roomID: players.get(socket.id).room });
            }
        }
    });
});

function player() {
    this.room = "-1";
}

function room(game, id) {
    this.game = game;
    this.players = [];
    this.players.push(id);
}

function board(game) {
    this.game = game;
    this.pieces = [];
}

//Tic Tac Toe


//Checkers

