#include <napi.h>
#include <vector>
#include "get_files_worker.h"
//#include "files.h"
#if WINDOWS
#include "windows/platform.h"
#elif LINUX
#include "linux/platform.h"
#endif
using namespace Napi;
using namespace std;

Value GetFiles(const CallbackInfo& info) {
    auto directory = (stdstring)info[0].As<nodestring>();
    auto show_hidden = info[1].As<Boolean>().Value();
    // auto worker = new Get_files_worker(info.Env(), directory, show_hidden);
    // worker->Queue();
    //return worker->Promise();
    return info.Env().Undefined();    
}