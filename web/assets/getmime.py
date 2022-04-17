import mimetypes
import sys
print(mimetypes.guess_type(sys.argv[1]))
