How to run python server + Backend to check
Backend
- CONNECTION_STRING="mongodb+srv://binh:123@cluster0.lcfx9nt.mongodb.net/car_parking?retryWrites=true&w=majority&appName=Cluster0" \
ACCESS_TOKEN_SECRET="05a560d9861c4b4f9d414dd0203f272951f6621cc008a0eca2d735260e1f466dfc513f3842d5945ec72cef6383c9bddd061d17c4ce0ef5e4980a7f524e600ab0" \
REFRESH_TOKEN_SECRET="rkol9AQxDYD5W+SZPeAPjhlznXT2un+rsmQr6XNFEY2pAWLfSuUTGnJo2jgW6jDpL8I/emm+Kgw0+4qOXMtR4w==" \
npm run dev

To run AI:
download model Ollama
To set up:
ollama pull llava-phi3
ollama pull nomic-embed-text


Check model if it's same with the one in ML_server.py
- # Change the model to one you have installed
    model = Ollama(model="llava-phi3")
Verify model:
- ollama list
Left this one run in another window -> connect model

back to ML_server
python ML_server.py