#include <napi.h>
#include <vector>
#include <gio/gio.h>
#include "get_app_icon_worker.h"
#include "../icon.h"
#include "../std_utils.h"
using namespace Napi;
using namespace std;

class Get_app_icon_worker : public AsyncWorker {
public:
    Get_app_icon_worker(const Napi::Env& env, GAppInfo* app)
    : AsyncWorker(env)
    , deferred(Promise::Deferred::New(Env())) 
    , app(app) {}
    ~Get_app_icon_worker() {}

    void Execute () { 
        icon_bytes = move(get_app_icon(app)); 
    }

    void OnOK();

    Napi::Promise Promise() { return deferred.Promise(); }

private:
    Promise::Deferred deferred;
    GAppInfo *app;
    vector<char> icon_bytes;
};

void Get_app_icon_worker::OnOK() {
    auto env = Env();
    HandleScope scope(env);

    // auto buffer_result = new vector<char>(move(icon_bytes));
    // auto buffer = Buffer<char>::New(env, buffer_result->data(), buffer_result->size(), [](Napi::Env, char*, vector<char>* to_delete){ delete to_delete; }, buffer_result);
    // deferred.Resolve(buffer);

    auto buffer = Napi::Buffer<char>::Copy(env, icon_bytes.data(), icon_bytes.size());
    deferred.Resolve(buffer);    
}

Value GetAppIcon(const CallbackInfo& info) {
    checkInitializeIcons();
    auto app = (GAppInfo*)info[0].As<Number>().Int64Value();
    auto worker = new Get_app_icon_worker(info.Env(), app);
    worker->Queue();
    return worker->Promise();
}

