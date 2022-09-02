# CryptoNeon Hex Game [JS SDK]
Made for [The Web3Game Online Hackathon](https://roketo.notion.site/The-Web3Game-Online-Hackathon-84fabf42829d44bba1045bb6ce001923).

[Main repository](https://github.com/d954mas/hackathon-rocketo-game) 

Build single js file with all SDK(Near, Roketo, my functions)

I Use Defold game engine. It is not JS game engine so i can't mix it build process with yarn. But defold can include js files in web build. So build single js file then add it in Defold project.

## Build.

 1. yarn build 
 2. Rename *build\static\js\main.????????.js* to
    *roketosdk.js* 
 3. Replace current SDK file \rocketo_hackathon_game\assets\bundle\web\roketosdk.js


