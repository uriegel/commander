#include <napi.h>
#if WINDOWS
    #include "windows/platform.h"
    #include "windows/get_drives_worker.h"
#elif LINUX
    #include "linux/platform.h"
#endif
#include "get_files_worker.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    exports.Set(String::New(env, "getFiles"), Function::New(env, GetFiles));
#if WINDOWS    
    exports.Set(String::New(env, "getDrives"), Function::New(env, GetDrives));
#else
#endif
    return exports;    
}

const char* addon = "_native";
NODE_API_MODULE(addon, Init)