#include <napi.h>
#if WINDOWS
#elif LINUX
    #include "linux/platform.h"
#endif
#include "get_files_worker.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    exports.Set(String::New(env, "getFiles"), Function::New(env, GetFiles));
    return exports;    
}

const char* addon = "_native";
NODE_API_MODULE(addon, Init)