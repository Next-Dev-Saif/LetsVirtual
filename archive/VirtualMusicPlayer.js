//importing core modules
import *as THREE from "three";
import {OrbitControls} from "./3D Core Modules/OrbitControls.js";
import {SceneManager} from "./3D Core Modules/Scene_Manager.js";
import {Animation_Manager} from "./3D Core Modules/Animation_Manager.js";
import {Create_LoadManager} from "./CommonLoadingManager.js";


//
const rayCaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
var isClicked=false;
document.addEventListener("mousemove",onPointerMove);
function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}
document.addEventListener("click",function(){
  isClicked=true;
  setTimeout(RecoverClick,100);
})
function RecoverClick(){
  isClicked=false
}
document.addEventListener("DOMContentLoaded",ONDOM_load)
function ONDOM_load()
{
//basic
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,(window.innerWidth)/(window.innerHeight),0.1,1000);
const renderer=new THREE.WebGLRenderer();
renderer.pixelRatio=window.devicePixelRatio;
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.id="Secreen";


//settings
const orbitC=new OrbitControls(camera,renderer.domElement);
scene.background=new THREE.Color().setColorName("gray")



//managers
const loadManagers=Create_LoadManager(LoadModels,progress);
const Scene_Manager=new SceneManager(scene,loadManagers);
var animationHandler;
camera.position.set(0.5,1.2,0.2);
orbitC.target=new THREE.Vector3(0.5,1.2,0.19);




const audioListener=new THREE.AudioListener();
camera.add(audioListener);

const audioLoader=new THREE.AudioLoader();
const positionalSound=new THREE.PositionalAudio(audioListener);




//lights
const lights=[new THREE.DirectionalLight(new THREE.Color(1,1,1),2)
,new THREE.DirectionalLight(new THREE.Color(1,1,1),2),
new THREE.DirectionalLight(new THREE.Color(1,1,1),2),
new THREE.DirectionalLight(new THREE.Color(1,1,1),2)
,new THREE.SpotLight(new THREE.Color().setColorName("white"),2),
new THREE.SpotLight(new THREE.Color().setColorName("white"),2),
new THREE.SpotLight(new THREE.Color().setColorName("white"),2),
new THREE.SpotLight(new THREE.Color().setColorName("white"),2),
]

lights[0].translateZ(10);
lights[1].translateZ(-10);
lights[2].translateX(-10);
lights[3].translateX(10);

lights[4].translateZ(10);
lights[5].translateZ(-10);
lights[6].translateX(-10);
lights[7].translateX(10);
//



function progress(url,loaded,total){
  const span=document.getElementById("loaded");
  span.innerText=Math.floor((loaded/total)*100)+" % loaded";
  document.getElementById("prog").value=Math.floor((loaded/total)*100)

}


//models
const Maclaren=Scene_Manager.Model_Adder("./assets/Ground/MacLaren.glb","laren");
const MaclenProps={w1:undefined,w2:undefined,w3:undefined,w4:undefined,Secreen:undefined}
const Driver=Scene_Manager.Model_Adder("./assets/Ground/Driver.glb","driver");



//fog




//add models
function LoadModels()
{ //removing loadingclass
  document.getElementById("loadClass").remove();
  Scene_Manager.Add_Recursive_Collection([Maclaren,Driver,]);
  Scene_Manager.Add_Recursive_Models([Maclaren,Driver,]);


  //set
 
  MaclenProps.w1=Maclaren.model.getObjectByName("WHEEL_LF");
  MaclenProps.w2=Maclaren.model.getObjectByName("WHEEL_LR");
  MaclenProps.w3=Maclaren.model.getObjectByName("WHEEL_RF");
  MaclenProps.w4=Maclaren.model.getObjectByName("WHEEL_RR");
  MaclenProps.Secreen=Maclaren.model.getObjectByName("Secreen");
  Scene_Manager.ChangeRotation("laren",0,Math.PI,0)
  Scene_Manager.ChangeRotation("driver",-(Math.PI/180)*10,0,0);
  Scene_Manager.ChangePosition("driver",0.5,-0.2,0.3);
  Maclaren.model.add(Driver.model)
  

  


Driver.model.traverse(function(m){
  if(m.isMesh){m.frustumCulled=false;}
})





  //
  lights.forEach(light=>{scene.add(light);light.translateY(5)})


  //animation handler and settings ofanimations 
  animationHandler=new Animation_Manager(Scene_Manager);
  animationHandler.IntroduceAnimation(Driver.animations[6],"driver","drive");
  animationHandler.PlayAnimation("drive");


}

//dom for cancel 
const ControlsDOM=document.getElementById("Controls");
ControlsDOM.style.display="none";
const CancelControls=document.getElementById("Icons");
CancelControls.addEventListener("click",()=>{
  ControlsDOM.style.display="none";
})
//


//                     DOM and 3d responsible for user picking sound and playing

//
const PlayButton={isClicked:false,dom:document.getElementById("play")};
const StopButton={isClicked:false,dom:document.getElementById("stop")};
const NextButton={isClicked:false,dom:document.getElementById("next")};

const InputFile=document.getElementById("select");
var InputHasFile=false;
InputFile.addEventListener("change",()=>{

SetUpAudioPlay();  
})

function SetUpAudioPlay()
{InputHasFile=true;   
 const ValueFile=URL.createObjectURL(InputFile.files[0]);
 audioLoader.load(ValueFile,function(buffer){
  positionalSound.setBuffer(buffer);
  positionalSound.setRefDistance(20);  
 }) 

}

//now play stop 
PlayButton.dom.addEventListener("click",function(){
  if(InputHasFile)
  {positionalSound.play();PlayButton.isClicked=true
    document.getElementById("console").innerText="Song is Playing ";
    document.getElementById("console").style.color="rgb(230, 213, 213)";}
  else {document.getElementById("console").innerText="Failed ! please upload a file ";
  document.getElementById("console").style.color="red"; }  
});
StopButton.dom.addEventListener("click",function(){
  if(InputHasFile)
  {positionalSound.stop();StopButton.isClicked=true;
    document.getElementById("console").innerText="Song is Stopped ";
    document.getElementById("console").style.color="rgb(230, 213, 213)";
   }
  else {document.getElementById("console").innerText="Failed ! please upload a file ";
  document.getElementById("console").style.color="red"; } 
});


NextButton.dom.addEventListener("click",function(){NextButton.isClicked=true;
 InputHasFile=false;
 positionalSound.stop();
  document.getElementById("console").innerText="Please Upload song ";
  document.getElementById("console").style.color="orange";
})

//








//animateLoop
Animate();
function Animate(){
    requestAnimationFrame(Animate);
     
      orbitC.update();
     
      if(MaclenProps.w1&&MaclenProps.w2&&MaclenProps.w3&&MaclenProps.w4&&MaclenProps.Secreen)
      {MaclenProps.w1.rotation.x+=0.1;
        MaclenProps.w2.rotation.x+=0.1;
        MaclenProps.w3.rotation.x+=0.1;
        MaclenProps.w4.rotation.x+=0.1;

        if(MaclenProps.w1.rotation.x>500){
          MaclenProps.w1.rotation.x=0.1;
        MaclenProps.w2.rotation.x=0.1;
        MaclenProps.w3.rotation.x=0.1;
        MaclenProps.w4.rotation.x=0.1;
        }
        
      //raycaster for secreenview
       rayCaster.setFromCamera(pointer,camera);
       const i=rayCaster.intersectObject(MaclenProps.Secreen);
       if(i.length!==0&&isClicked==true)
       {ControlsDOM.style.display="flex";

       }


      }
     
      if(animationHandler)
     {
        animationHandler.Update();
        //adding moving simulation
        Maclaren.model.position.z=0.1*Math.sin(Date.now()/700);
        Maclaren.model.position.x=0.01*Math.cos(Date.now()/700);
       
          
     }
     
    renderer.render(scene,camera);
}












}


