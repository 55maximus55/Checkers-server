var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var HashMap = require('hashmap');

var games = ["tictactoe", "checkers", "chess"]
var rooms = new HashMap()
var players = new HashMap()

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

// запуск сервера
server.listen(process.env.PORT, function(){
  console.log("server_port " + process.env.PORT);
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
        // for (var i = 0; i < players.length; i++) {
        //     if (players[i].room != -1) {
        //         var g = true;
        //         for (var j = 0; j < rooms.length; j++) {
        //             if (rooms[j].id == data.id) {
        //                 g = false;
        //                 //вход в комнату и сообщение об этом игрокам
        //                 players[i].room = data.id;
        //                 rooms[j].players.push(socket.id);
        //                 socket.emit('joinRoomSuccess', { roomID: rooms[j].id });
        //                 socket.broadcast.emit('joinRoom', { playerID: socket.id, roomID: rooms[j].id });
        //                 console.log("Player (" + socket.id +") joined to room (" + rooms[j].id + ")");
        //             }
        //         }
        //         if (g) {
        //             socket.emit('joinRoomError', { reason: "404: room not found"});
        //         }
        //     }
        //     else {
        //         socket.emit('createRoomError', { reason: "Leave another room before join another" });
        //     }
        // }
    });

    //выход из комнаты
    socket.on('leaveRoom', function(data) {

    });

    //удаление комнаты
    socket.on('deleteRoom', function(data) {

    });

    //ход игрока
    socket.on('playerMove', function(data) {

    });

    //отключение игрока от сервера
    socket.on('disconnect', function() {
        //оповещение об отключении
        console.log("Player disconnected (" + socket.id + ")");
        socket.broadcast.emit('playerDisconnected', { id: socket.id });
        //удаление отключившегося игрока
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == socket.id) {
                if (players[i].room != -1) {
                    for (var j = 0; j < rooms.length; j++) {
                        if (players[i].room == rooms[j].id) {
                            for (var k = 0; k < rooms[j].players.length; k++) {
                                if (players[i].id == rooms[j].players[k]) {
                                    rooms[j].players.splice(k, 1);
                                }
                            }
                        }
                    }
                }
                players.splice(i, 1);
                //Удаление комнаты, если это был последний игрок
                
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

