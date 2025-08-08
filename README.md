# Moni Park

# Prerequisites

Node JS

# Backend

download Docker Desktop -> turn on Docker

run cmd to run the backend: 

docker pull brandonng/car-parking

docker run -p 1313:1313  --name car-parking-container-e  -e CONNECTION_STRING="mongodb+srv://binh:123@cluster0.lcfx9nt.mongodb.net/car_parking?retryWrites=true&w=majority&appName=Cluster0"  -e ACCESS_TOKEN_SECRET="05a560d9861c4b4f9d414dd0203f272951f6621cc008a0eca2d735260e1f466dfc513f3842d5945ec72cef6383c9bddd061d17c4ce0ef5e4980a7f524e600ab0" -e REFRESH_TOKEN_SECRET="rkol9AQxDYD5W+SZPeAPjhlznXT2un+rsmQr6XNFEY2pAWLfSuUTGnJo2jgW6jDpL8I/emm+Kgw0+4qOXMtR4w==" brandonng/car-parking

the backend will run on port http://localhost:1313

# Frontend
git clone project or unzip folder
run cmd to run the frontend:

git clone https://github.com/VehicleParkingTrackingApplication/VehicleParkingApplication

cd FrontEnd

npm install

npm run dev

the frontend will run on port http://localhost:5173