//main file responsible for loading home page 

/*----------Importing core modules--------------------------*/
import *as THREE from "three";
import {SceneManager} from "./3D Core Modules/Scene_Manager.js";
import {Animation_Manager} from "./3D Core Modules/Animation_Manager.js";
import {Create_LoadManager} from "./CommonLoadingManager.js";
import {EffectComposer} from "./3D Core Modules/EffectComposer.js";
import { RenderPass } from "./3D Core Modules/RenderPass.js";
import {UnrealBloomPass} from "./3D Core Modules/UnrealBloomPass.js";
import { OrbitControls } from "./3D Core Modules/OrbitControls.js";

document.addEventListener("DOMContentLoaded",LoadWeb)

function LoadWeb()
{
/*--------------------------------------------3D Scene-------------------------------------------------*/
const Scene=new THREE.Scene();
const Camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
const Renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});

//settings
Renderer.setSize(window.innerWidth,window.innerHeight);
Camera.position.set(-0.3,1.5,2);
document.body.appendChild(Renderer.domElement);
const orbit=new OrbitControls(Camera,Renderer.domElement);
orbit.target=new THREE.Vector3(-0.2,1.5,1.9);
orbit.enableZoom=false;
orbit.enablePan=false;

const composer=new EffectComposer(Renderer);
const renderPass=new RenderPass(Scene,Camera);
const bloomPass=new UnrealBloomPass(new THREE.Vector2(window.innerWidth,window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(renderPass);
composer.addPass(bloomPass);


//


//resize handler
window.addEventListener("resize",function(){
    Renderer.setSize(this.window.innerWidth,this.window.innerWidth);
    Camera.updateProjectionMatrix();
})
//

//managers
const LoadingManager=Create_LoadManager(AddModels,ProgressHandler);
const Scene_Handler=new SceneManager(Scene,LoadingManager);
var Animation_Handler;  //is varribale because i want to add animation when scene manager have models

Camera.lookAt(new THREE.Vector3(0,1,-5))
//

//progress handler


//load controller
const loadBar=document.getElementById("loaded");
const loadDiv=document.getElementById("loadDiv");
const percentShow=document.getElementById("percent");

function ProgressHandler(url,loaded,total)
{ loadBar.value=Math.floor((loaded/total)*100);
  percentShow.innerText=loadBar.value+" % loaded";

}



//models
const Greeter=Scene_Handler.Model_Adder("./assets/HomePageGreeter.glb","greeter");
const Greeter2=Scene_Handler.Model_Adder("./assets/HomePageGreeter3.glb","greeter2");
const Greeter3=Scene_Handler.Model_Adder("./assets/HomePageGreeter2.glb","greeter3");
const Home=Scene_Handler.Model_Adder("./assets/ActualExplorer.glb","h");
const BG=Scene_Handler.Model_Adder("./assets/VirtualBG.glb","bg");

var GreeterSelected=localStorage.getItem("Greeter") || undefined;

if(GreeterSelected==undefined)
GreeterSelected="Default";





//

//lights
 const Lights=[
    new THREE.DirectionalLight("white",1),
    new THREE.SpotLight("white",1)
   ]
   Lights.forEach(l=>{Scene.add(l);l.position.z=5;if(l.isSpotLight){l.lookAt(0,0,0);}})
//

//model Adder
function AddModels()
{ Scene_Handler.Add_Recursive_Collection([Greeter,Home,Greeter2,Greeter3,BG]);
     //default greeter  
    if(GreeterSelected=="Default"||GreeterSelected==undefined)
  Scene_Handler.Add_Recursive_Models([Greeter,Home,BG]);
  //JSON
  if(GreeterSelected=="JSON")
  Scene_Handler.Add_Recursive_Models([Greeter2,Home,BG]);
  //Armina 
  if(GreeterSelected=="Armina")
  Scene_Handler.Add_Recursive_Models([Greeter3,Home,BG]);
  


  console.log(GreeterSelected);
  Animation_Handler=new Animation_Manager(Scene_Handler);
  Lights[0].target=Greeter.model;

    Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter.animations,"TalkingMouth"),
    "greeter","a1"),
    Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter.animations,"TalkingSmile"),
    "greeter","a2")
    Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter.animations,"Talking1"),
    "greeter","a3")
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter.animations,"GoodTalking"),
    "greeter","a4")
    
   //JSON animations
   
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter2.animations,"NromalIdle"),
   "greeter2","Ja1");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter2.animations,"Idle2"),
   "greeter2","Ja2");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter2.animations,"Talking"),
   "greeter2","Ja3");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter2.animations,"Holding"),
   "greeter2","Ja4");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter2.animations,"Excited"),
   "greeter2","Ja5");

   //Armina animations
   console.log(Greeter3.animations);
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter3.animations,"Idle"),
   "greeter3","Aa1");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter3.animations,"Idle2"),
   "greeter3","Aa2");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter3.animations,"Talking"),
   "greeter3","Aa3");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter3.animations,"Holding"),
   "greeter3","Aa4");
   Animation_Handler.IntroduceAnimation(THREE.AnimationClip.findByName(Greeter3.animations,"Excited"),
   "greeter3","Aa5");
   

//Adjust animations loop
Animation_Handler.Change_Animation_Loop("Ja1",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Ja2",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Ja3",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Ja4",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Ja5",THREE.LoopPingPong);

Animation_Handler.Change_Animation_Loop("Aa1",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Aa2",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Aa3",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Aa4",THREE.LoopPingPong);
Animation_Handler.Change_Animation_Loop("Aa5",THREE.LoopPingPong);
//


if(GreeterSelected=="Default")
{Animation_Handler.PlayAnimation("a1");
Animation_Handler.PlayAnimation("a2");
Animation_Handler.PlayAnimation("a3");
Animation_Handler.PlayAnimation("a4");
}

if(GreeterSelected=="JSON")
{Animation_Handler.PlayAnimation("Ja5")}
if(GreeterSelected=="Armina")
{Animation_Handler.PlayAnimation("Aa1")}

loadDiv.remove();

}
//some before access varribales
var isShining="off";

//RenderLoop 
RenderLoop();
function RenderLoop(){
    requestAnimationFrame(RenderLoop);
   

    //updating enteties
   if(Animation_Handler){Animation_Handler.Update()};
   if(isShining=="on") 
   composer.render(Scene,Camera);
   else if(isShining=="off")
   Renderer.render(Scene,Camera);
}
/*------------------------------------------------------------------------------------------------------*/

/*--------------------------------------------DOM---------------------------------------------*/

const GreetMessage=new SpeechSynthesisUtterance("Welcome to my portfolio , i greet you  here , enjoy three dee experience. There is much to discuss and time is never enough xd , enjoy please");
//speechSynthesis.speak(GreetMessage);

const Speeches=[
    new SpeechSynthesisUtterance("Please choose a greeter that you want , selected greeter will also act as host over web "),
    new SpeechSynthesisUtterance("Shineness is increased , as you can see "),
    new SpeechSynthesisUtterance("Please select question to get answers"),
    new SpeechSynthesisUtterance("Brightness adjusted")
]

//tips messages
const Tips=[
"Enjoy the 3D experience with Lets Virtual",
"Welcome to Lets Virtual ",
"This website shows power of three js ",
"Welcome and thanks for exploring my web",
"Nice to see you , please feel free to explore by clicking"
]
const MessageDiv=document.createElement("div");
MessageDiv.className="messages";
MessageDiv.innerHTML=Tips[Math.floor(Math.random()*Tips.length)]+
"<img src=./assets/messageIcon.png height=50px width=50px>";
document.body.appendChild(MessageDiv);

setInterval(function(){
    MessageDiv.innerHTML=Tips[Math.floor(Math.random()*Tips.length)]+"<img src=./assets/messageIcon.png height=50px width=50px>";
},3000)

//anchor tags mouseover
const Anchors=[...document.getElementsByTagName("a")];
Anchors.forEach(anchor=>{
    anchor.addEventListener("mouseover",function(){
      const div=document.getElementById("info");
      div.style.display="grid";
      const divChild=div.children.item(0);
      divChild.innerHTML="Click on <strong>"+ this.textContent  +"</strong> to go virtually , each experience is 3D";

    })
    anchor.addEventListener("mouseleave",function(){const div=document.getElementById("info");div.style.display="none"})
})

//birghness handler
const BrightHandler=document.getElementById("Brightness");
BrightHandler.onchange=function(){
    speechSynthesis.speak(Speeches[3])
    const value=this.value;
    Lights.forEach(light=>{light.intensity=value/10})
}
//shiness handler
const ShineHandler=document.getElementById("isShining");
ShineHandler.onclick=function(e){

    if(isShining=="off")
 {isShining="on"; speechSynthesis.speak(Speeches[1])}
 else isShining="off";
}

//Greeter Selection
const GreeterSelection=document.getElementById("GreeterChange");
const GreeterSelectionDiv=document.getElementById("GS");
var GreeterisClicked=false;
GreeterSelection.addEventListener("click",function(){
    if(GreeterisClicked==false)
    {document.getElementById("GS").style.display="flow-root";
     document.getElementById("GS").style.animation="SelectionAni 1s linear 1";
        GreeterisClicked=true;
        speechSynthesis.speak(Speeches[0]);
    }
    else if(GreeterisClicked==true)
    {document.getElementById("GS").style.display="none";
    document.getElementById("GS").style.animation="none";
    GreeterisClicked=false};
})

const Greeters=[document.getElementById("Default"),document.getElementById("Armina"),document.getElementById("JSON")];
Greeters.forEach(greeter=>{
    greeter.addEventListener("click",function(){
        localStorage.setItem("Greeter",this.id);
        confirm("Greeter Selected reload page or go to another page");
        GreeterSelectionDiv.style.display="none";

    })
})

//Guide Cancel
const GuideButton=document.getElementById("GuideCancel");
GuideButton.addEventListener("click",function(){
    document.getElementById("guide").remove();
})



}