/*
       Creates a loadiing manager to tell user to wait 
*/
import { LoadingManager } from "./3D Core Modules/three.module.js";

export function Create_LoadManager(LoadedCallback,ProgressCallback)
{ const Manager=new LoadingManager();
  Manager.onLoad=()=>{LoadedCallback()};
  if(ProgressCallback)
  Manager.onProgress=(url,loaded,total)=>{ProgressCallback(url,loaded,total)};

  return Manager
}


