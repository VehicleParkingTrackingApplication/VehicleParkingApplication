Method 1: Run by docker container
1. install docker desktop -> access the image link: https://hub.docker.com/r/brandonng/car-parking-monitoring-v0

2. run in the terminal: 
docker pull brandonng/car-parking-monitoring-v0
docker run -d -p 8001:1313 binhng/car-parking:v1

open the localhost:8001

Step 1:
install nodejs at https://nodejs.org/en
check nodejs by cmd: 
node -v

Step 2:
clone the github repo by cmd:
git clone {repo link}

Step 3: install packages
```
cd Backend
npm i
```

Step 4: run the backend
move to backend folder and run the command:
```
npm run start
```



