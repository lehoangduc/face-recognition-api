import os
import re
import sys
import getopt
import zerorpc

class FaceRPC(object):
    def find(self, path):
        return ['obama-1','obama-2']

def main(argv):
   host = ''
   port = ''

   try:
      opts, args = getopt.getopt(argv, 'h:p:',["host=","port="])
   except getopt.GetoptError:
      print('usage: server.py -h <host> -p <port>')
      sys.exit(2)

   for opt, arg in opts:
      if opt in ("-h", "--host"):
         host = arg
      elif opt in ("-p", "--port"):
         port = arg

   if (not host or not port):
       print('usage: server.py -h <host> -p <port>')
       sys.exit(2)

   print('Server running at {}:{}'.format(host, port))

   server = zerorpc.Server(FaceRPC())
   server.bind("tcp://" + host + ":" + port)
   server.run()

if __name__ == "__main__":
   main(sys.argv[1:])