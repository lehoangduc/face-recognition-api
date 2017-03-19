Face Recognition API
======

> An Open-source built on top of Python and NodeJs that lets you build your own Face Recognition API

## Requiments

- Python3
- NodeJs >= 7.0.0 
- [Face Recognition Python module](https://github.com/ageitgey/face_recognition)
- [zeromq](http://zeromq.org)
- [zerorpc](http://www.zerorpc.io)

## Installation

```bash
$ cd api
$ npm install
$ cp .env.example .env

$ pip3 install zerorpc
```

## How It Works
User request an URL <==> NodeJs API (Download image from URL) <==> Python RPC Server (Identify the face from known images)

## Quick Start
* Edit variables in .env file
* Copy person pictures you already know to "examples/images" folder
* Run commands

```bash
# Start RPC server
$ cd rpc
$ python4 server.py -h 127.0.0.1 -p 8001 -d examples/images

# Start NodeJs API service
$ cd api
$ npm start

# Run with example URL
$ curl http://127.0.0.1:8000/find?url=http://images.ndh.vn/Images/Uploaded/Share/2016/05/19/f51160112-obama-1101p1d16238ca868f5d9b1eb70c950d8f03fnbcnews-fp-1200-800.jpg

```

## Contributing

All contributions are welcome to help improve Face Recognition API.

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Golr