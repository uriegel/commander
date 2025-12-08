#include <napi.h>
#if WINDOWS
    #include "windows/platform.h"
    #include "windows/get_drives_worker.h"
#elif LINUX
    #include "linux/platform.h"
    #include "linux/accent_color.h"
#endif
#include "get_files_worker.h"
#include "get_icon_worker.h"
#include "get_icon_from_name_worker.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    exports.Set(String::New(env, "getFiles"), Function::New(env, GetFiles));
    exports.Set(String::New(env, "getIcon"), Function::New(env, GetIcon));
    exports.Set(String::New(env, "getIconFromName"), Function::New(env, GetIconFromName));
#if WINDOWS    
    exports.Set(String::New(env, "getDrives"), Function::New(env, GetDrives));
#else
    exports.Set(String::New(env, "getAccentColor"), Function::New(env, GetAccentColor));
#endif
    return exports;    
}

const char* addon = "_native";
NODE_API_MODULE(addon, Init)