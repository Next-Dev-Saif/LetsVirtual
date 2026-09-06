/*----------Importing core modules--------------------------*/
import *as THREE from "three";
import {SceneManager} from "./3D Core Modules/Scene_Manager.js";
import {Animation_Manager} from "./3D Core Modules/Animation_Manager.js";
import {Create_LoadManager} from "./CommonLoadingManager.js";
import{OrbitControls} from "./3D Core Modules/OrbitControls.js";

document.addEventListener("DOMContentLoaded",LoadWeb);

function LoadWeb()
{
/*--------------------------------------------3D Scene-------------------------------------------------*/
const Scene=new THREE.Scene();
const Camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
const Renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});

//settings
Renderer.setSize(window.innerWidth,window.innerHeight);
Camera.position.set(-0.22,1.29,2.45);
document.body.appendChild(Renderer.domElement);
const orbit=new OrbitControls(Camera,Renderer.domElement);
orbit.target=new THREE.Vector3(-0.21,1.29,2.43);
orbit.enableZoom=false;
orbit.enablePan=false;
var OpenDiv=false; //should show div containing projects or not
var allowClick=true; //to avoid constantly appearing div even clicked on cancel button

//mobile device detections
const querry=window.navigator.userAgent;
var isMobile;
if(querry.includes("Android")||querry.includes("iPhone")||querry.includes("Phone"))
isMobile=true;
else isMobile=false;
console.log("is device Mobile ? ",isMobile);

//raycaster
const rayCaster=new THREE.Raycaster();

const pointer=new THREE.Vector2();
document.addEventListener("mousemove",onPointerMove)
function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

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
//



//models
const Greeter=Scene_Handler.Model_Adder("./assets/HomePageGreeter.glb","greeter");

const Greeter2=Scene_Handler.Model_Adder("./assets/HomePageGreeter3.glb","greeter2");
const Greeter3=Scene_Handler.Model_Adder("./assets/HomePageGreeter2.glb","greeter3");
const documentsCase=Scene_Handler.Model_Adder("./assets/suitcase.glb","case");
const BG=Scene_Handler.Model_Adder("./assets/VirtualBG.glb","bg");

var GreeterSelected=localStorage.getItem("Greeter") || undefined;

if(GreeterSelected==undefined)
GreeterSelected="Default";
//

//lights
 const Lights=[
    new THREE.DirectionalLight("white",1),
    new THREE.SpotLight("white",1),
    new THREE.AmbientLight("white",0.2)
   ]
   Lights.forEach(l=>{Scene.add(l);l.position.z=5;if(l.isSpotLight){l.lookAt(0,0,0);}})
//



//Projects Group
  //textures
const Tloader=new THREE.TextureLoader(LoadingManager);
const p1t1=Tloader.load("./assets/VirtualContactIcon.png");
const p2t2=Tloader.load("./assets/TikTok.png");
const p3t3=Tloader.load("./assets/Water.jpg");


const ProjectGroup=new THREE.Group();
      //materials
const Project1Material=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:p1t1});
const Project2Material=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:p2t2});
const Project3Material=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:p3t3});

      //same geometry
const ProjectGeometry=new THREE.BoxGeometry(1,0.1,1.5);

    //meshes
const Project1=new THREE.Mesh(ProjectGeometry,Project1Material);
const Project2=new THREE.Mesh(ProjectGeometry,Project2Material);
const Project3=new THREE.Mesh(ProjectGeometry,Project3Material);

   //position
Project1.position.set(-2,0,0);
Project2.position.set(2,0,0);
Project3.position.set(0,0,0);


ProjectGroup.add(Project1,Project2,Project3);
ProjectGroup.scale.set(0.2,0.5,0.2)
ProjectGroup.position.set(0,1,0);
ProjectGroup.rotation.x=0.3;
Scene.add(ProjectGroup);



//adding data
Project1.userData={title:"Virtual Squid Game ",
description:"Play a 3d squid game , you know green light red light , avoid doll 's gaze at all cost ",
link:"./VirtualMusicPlayer.html"
};
Project2.userData={title:"Virtual Chat App ",
description:"Chat with others online and virtually , enjoy 3D experience",
link:"./VirtualMusicPlayer.html"
}
Project3.userData={title:"Virtual Music Player ",
description:"Enjoy 3D harmony , enter a virtual world and enjoy 3d music with this music player ",
link:"./VirtualMusicPlayer.html"
}





//

//model Adder
function AddModels()
{ 
  Scene_Handler.Add_Recursive_Collection([Greeter,Greeter2,Greeter3,documentsCase,BG]);
  //default greeter  
 if(GreeterSelected=="Default"||GreeterSelected==undefined)
Scene_Handler.Add_Recursive_Models([Greeter,BG]);
//JSON
if(GreeterSelected=="JSON")
Scene_Handler.Add_Recursive_Models([Greeter2,BG]);
//Armina 
if(GreeterSelected=="Armina")
Scene_Handler.Add_Recursive_Models([Greeter3,BG]);



console.log(GreeterSelected);

  Scene_Handler.ChangePosition("greeter2",-1,0,0);
  Scene_Handler.ChangePosition("greeter3",-1,0,0);
  Scene_Handler.ChangePosition("greeter",-1,0,0);
  Scene_Handler.ChangeRotation("greeter2",0,(Math.PI/180)*30,0);
  Scene_Handler.ChangeRotation("greeter3",0,(Math.PI/180)*30,0);
  Scene_Handler.ChangeRotation("greeter",0,(Math.PI/180)*30,0);



 
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
  
  //breifCase animation
  Animation_Handler.IntroduceAnimation(documentsCase.animations[0],"case","open");

  
  
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

  Animation_Handler.Change_Animation_Loop("open",THREE.LoopOnce);
  Animation_Handler.getAnimationByName("open").clampWhenFinished=true;
  Animation_Handler.getAnimationByName("open").setDuration(3);

  //adding eventlistener to mixer
  Animation_Handler.getMixerByModel_name("case").addEventListener("finished",function(){
    
     ProjectGroup.scale.set(0.5,0.5,0.5);
     ProjectGroup.position.set(0,1,1);
     ProjectGroup.rotation.x=Math.PI/2;
     OpenDiv=true; //when box opens open div


  })
  //
 


if(GreeterSelected=="Default")
{Animation_Handler.PlayAnimation("a1");
Animation_Handler.PlayAnimation("a2");
Animation_Handler.PlayAnimation("a3");
Animation_Handler.PlayAnimation("a4");
}

if(GreeterSelected=="JSON")
{Animation_Handler.PlayAnimation("Ja2")}
if(GreeterSelected=="Armina")
{Animation_Handler.PlayAnimation("Aa2")}


//breif case
if(GreeterSelected=="Default")
{ Scene_Handler.Add_to_Scene("case");
  documentsCase.model.scale.set(60,60,60);
  documentsCase.model.position.set(0,1,0);
  documentsCase.model.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),(Math.PI/180)*30);
 

}
if(GreeterSelected=="JSON")
{ Scene_Handler.Add_to_Scene("case");
  documentsCase.model.scale.set(60,60,60);
  documentsCase.model.position.set(0,1,0);
  documentsCase.model.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),(Math.PI/180)*30);
 
  
}
if(GreeterSelected=="Armina")
{ Scene_Handler.Add_to_Scene("case");
  documentsCase.model.scale.set(60,60,60);
  documentsCase.model.position.set(0,1,0);
  documentsCase.model.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),(Math.PI/180)*30);
 
}

loadDiv.remove();

}
//some before access varribales
var beingIntersected=false,isClicked=false;
document.addEventListener("click",function(){
  isClicked=true;
  setTimeout(Recover,100);
})
function Recover(){isClicked=false}
function RecoverColor(obj){obj.material.color=undefined}
//RenderLoop 
RenderLoop();
function RenderLoop(){
    requestAnimationFrame(RenderLoop);
   

    //updating enteties
   if(Animation_Handler){Animation_Handler.Update()};

   //raycasting for document get
   if(Greeter.model&&Greeter2.model&&Greeter3.model&&documentsCase.model&&Animation_Handler&&BG.model)
   {  BG.model.rotation.y+=0.001;
      //raycasting case
      rayCaster.setFromCamera(pointer,Camera);
      const intersects=rayCaster.intersectObject(documentsCase.model);
      if(intersects.length!==0){
        beingIntersected=true;
       
        
        if(beingIntersected==true&&isClicked==true){
            Animation_Handler.PlayAnimation("open");

        }
      }
      else {beingIntersected=false;}
   }

   if(OpenDiv==true&&Greeter.model,Greeter2.model,Greeter3.model,Animation_Handler,BG.model)
   { rayCaster.setFromCamera(pointer,Camera);
     const i=rayCaster.intersectObjects([Project1,Project2,Project3],false);
    
     if(i.length!==0&&OpenDiv!==false&&isClicked&&allowClick!==false)
     { document.getElementById("pi").style.display="grid";  
      document.getElementById("title").innerText=i[0].object.userData.title;
        document.getElementById("Description").innerText=i[0].object.userData.description;
        document.getElementById("go").href=i[0].object.userData.link;
       
     
     }
   
    

   }


  
  
  
   
   Renderer.render(Scene,Camera);
}

/*--------------------------------------------------DOM-----------------------------------------------------------*/
//Guide Cancel
const GuideButton=document.getElementById("GuideCancel");
GuideButton.addEventListener("click",function(){
    document.getElementById("guide").remove();
})

//Cancel projectsIngo
const CancelProjectInfo=document.getElementById("infoCancel");
CancelProjectInfo.onclick=function(){
  document.getElementById("pi").style.display="none";
}

//event on infodiv
const infoDiv=document.getElementById("pi");
infoDiv.addEventListener("mouseover",function(){allowClick=false});
infoDiv.addEventListener("mouseleave",function(){allowClick=true});














}

