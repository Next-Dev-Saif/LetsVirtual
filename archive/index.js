const http=require('http');
const clientPath=`${__dirname}`;
const e=require("express");
const application=e();
application.use(e.static(clientPath));
const server=http.createServer(application);

const socket_io=require("socket.io");
const IO=socket_io(server);
//web data
const ConnectedExplorers=[];
const ActiveExplorers=[];
//
IO.on("connection",function(socket){
    ConnectedExplorers.push(socket);
    console.log("Connected Explorers are "+ConnectedExplorers.length);  //storing for connection
    
    ConnectedExplorers.forEach(sock=>{
     sock.on("ready",function(){
           ActiveExplorers.push(sock);
            console.log("Active Explorers are  "+ActiveExplorers.length);
            })
    })

})










server.listen(3000,function(){
    console.log("web running on port 3000");
})